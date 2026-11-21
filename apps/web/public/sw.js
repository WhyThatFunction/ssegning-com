// Service worker for ssegning.com: lets a reader open pages they have already
// visited without a connection. Hand-written, as the Next.js PWA guide
// suggests, because the rules are short and a library would hide them.
//
// What it caches, and how:
//   - /_next/static/*  cache-first. File names carry a content hash, so a
//                      cached copy can never be stale. Kept across deploys,
//                      so a page saved last week still finds its scripts
//                      offline; capped, oldest out first.
//   - /_next/image     cache-first, capped. Resized images for a given URL
//                      and width do not change.
//   - page navigations network-first, HTML only, stored by path (query
//                      strings such as utm_* are ignored). Online readers
//                      get the live page as soon as its headers arrive; the
//                      saved copy is used when the network fails or takes
//                      longer than NAVIGATION_TIMEOUT_MS. With no copy, the
//                      offline page is shown.
// Everything else (other origins, /api, non-GET, React Server Component
// requests made during client-side navigation) is left to the network
// untouched. If an RSC request fails offline, Next falls back to a full page
// load, which this worker then answers from the page cache.
//
// Only complete 200 responses from this origin are stored, never an error
// page, a 404 or a redirect. Storing happens beside the response, never in
// its way: a full disk or any other cache error costs the saved copy, not
// the page.
//
// /sw-build.js (app/sw-build.js/route.ts) sets self.SW_BUILD to the commit
// the site was built from. The browser compares imported scripts too, so
// every deploy installs a fresh worker: it saves that deploy's offline page
// and its assets again, and activation drops the previous offline cache.
// Bump RULES when the caching rules change; activation then drops every
// cache from older rules. To retire the worker, ship one that calls
// self.registration.unregister() in its activate handler; deleting this file
// leaves the old worker running.

importScripts('/sw-build.js');

const RULES = 'v1';
const STATIC_CACHE = `static-${RULES}`;
const IMAGE_CACHE = `images-${RULES}`;
// The offline page lists the entries of every cache named `pages-*`
// (src/app/offline/cached-pages.tsx).
const PAGE_CACHE = `pages-${RULES}`;
const OFFLINE_CACHE = `offline-${RULES}-${self.SW_BUILD}`;
const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE, OFFLINE_CACHE];

const OFFLINE_URL = '/offline';
const NAVIGATION_TIMEOUT_MS = 4000;
const MAX_PAGES = 60;
const MAX_IMAGES = 120;
const MAX_STATIC = 400;

function isCacheable(response) {
  return response.status === 200 && response.type === 'basic';
}

function isHtml(response) {
  return (response.headers.get('content-type') ?? '').startsWith('text/html');
}

/** Deletes the oldest entries (insertion order) beyond `max`. */
async function trim(cache, max) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

/** Saves a copy; never rejects, since a failed save must not fail anything else. */
async function store(cacheName, key, response, max) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(key, response);
    if (max) await trim(cache, max);
  } catch {
    // Quota, storage pressure, private mode: carry on without the copy.
  }
}

/** A cache lookup that treats any cache error as a miss. */
async function lookup(cacheName, key) {
  try {
    return await caches.match(key, { cacheName });
  } catch {
    return undefined;
  }
}

/**
 * Saves the offline page and the /_next/static files it loads. The page is
 * only ever fetched here, never rendered online, so without this its scripts
 * would be missing exactly when it is shown: it would display, but its list
 * of saved pages (a client component) would never run.
 */
async function precacheOfflinePage() {
  const response = await fetch(new Request(OFFLINE_URL, { cache: 'reload' }));
  if (!isCacheable(response)) throw new Error(`offline page answered ${response.status}`);

  const html = await response.clone().text();
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? [])];
  const staticCache = await caches.open(STATIC_CACHE);
  // One missing asset must not cost the whole install; the page still shows,
  // and the next deploy's worker tries again.
  await Promise.all(assets.map((asset) => staticCache.add(asset).catch(() => undefined)));

  await (await caches.open(OFFLINE_CACHE)).put(OFFLINE_URL, response);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheOfflinePage().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => !CURRENT_CACHES.includes(name)).map((name) => caches.delete(name)),
        ),
      )
      .then(() => caches.open(STATIC_CACHE))
      .then((cache) => trim(cache, MAX_STATIC))
      .catch(() => undefined)
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(event, cacheName, max) {
  const cached = await lookup(cacheName, event.request);
  if (cached) return cached;

  const response = await fetch(event.request);
  if (isCacheable(response)) {
    event.waitUntil(store(cacheName, event.request, response.clone(), max));
  }
  return response;
}

/** The key a page is stored under: its path, without query or fragment. */
function pageKey(request) {
  const url = new URL(request.url);
  return url.origin + url.pathname;
}

async function networkFirst(event) {
  const { request } = event;
  const key = pageKey(request);

  // Registered now, while the event is certainly still open: the save may
  // finish after the reader has already been answered from the cache.
  let saved;
  event.waitUntil(new Promise((resolve) => (saved = resolve)));

  const network = fetch(request).then(
    (response) => {
      if (isCacheable(response) && isHtml(response)) {
        store(PAGE_CACHE, key, response.clone(), MAX_PAGES).then(saved);
      } else {
        saved();
      }
      return response;
    },
    (error) => {
      saved();
      throw error;
    },
  );

  const cached = await lookup(PAGE_CACHE, key);
  if (!cached) {
    try {
      return await network;
    } catch {
      return (await lookup(OFFLINE_CACHE, OFFLINE_URL)) ?? Response.error();
    }
  }

  // A copy exists: prefer the network, but do not leave the reader waiting
  // on a dead connection for longer than the timeout.
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve(cached), NAVIGATION_TIMEOUT_MS),
  );
  return Promise.race([network.catch(() => cached), timeout]);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(event, STATIC_CACHE, MAX_STATIC));
    return;
  }

  if (url.pathname === '/_next/image') {
    event.respondWith(cacheFirst(event, IMAGE_CACHE, MAX_IMAGES));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event));
  }
});

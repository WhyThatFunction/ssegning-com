// Service worker for ssegning.com: lets a reader open pages they have already
// visited without a connection. Hand-written, as the Next.js PWA guide
// suggests, because the rules are short and a library would hide them.
//
// What it caches, and how:
//   - /_next/static/*  cache-first. File names carry a content hash, so a
//                      cached copy can never be stale.
//   - /_next/image     cache-first, capped. Resized images for a given URL
//                      and width do not change.
//   - page navigations network-first. Online readers always get the live
//                      page; the copy is kept only for when the network is
//                      gone or slower than NAVIGATION_TIMEOUT_MS. With no
//                      copy at all the offline page is shown.
// Everything else (other origins, /api, non-GET, React Server Component
// requests made during client-side navigation) is left to the network
// untouched. If an RSC request fails offline, Next falls back to a full page
// load, which this worker then answers from the page cache.
//
// Only complete 200 responses from this origin are stored: never an error
// page, a 404, or a redirect.
//
// Bump VERSION when the caching rules change; activation deletes every cache
// from older versions. To retire the worker, ship one that calls
// self.registration.unregister() in its activate handler.

const VERSION = 'v1';
const STATIC_CACHE = `static-${VERSION}`;
const IMAGE_CACHE = `images-${VERSION}`;
// Read by the offline page (src/app/offline/cached-pages.tsx) to list what
// can still be opened. Keep the two names in step.
const PAGE_CACHE = `pages-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];

const OFFLINE_URL = '/offline';
const NAVIGATION_TIMEOUT_MS = 4000;
const MAX_PAGES = 60;
const MAX_IMAGES = 120;

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
  // One missing asset must not cost the whole install; the page still shows.
  await Promise.all(assets.map((asset) => staticCache.add(asset).catch(() => undefined)));

  await (await caches.open(PAGE_CACHE)).put(OFFLINE_URL, response);
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
      .then(() => self.clients.claim()),
  );
});

function isCacheable(response) {
  return response.status === 200 && response.type === 'basic';
}

/** Deletes the oldest entries (insertion order) beyond `max`. */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    await cache.put(request, response.clone());
    if (max) await trim(cacheName, max);
  }
  return response;
}

/** The page URL a navigation is stored under: path and query, no fragment. */
function pageKey(request) {
  const url = new URL(request.url);
  return url.origin + url.pathname + url.search;
}

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  const key = pageKey(request);

  const network = fetch(request).then(async (response) => {
    if (isCacheable(response)) {
      await cache.put(key, response.clone());
      await trim(PAGE_CACHE, MAX_PAGES);
    }
    return response;
  });

  const cached = await cache.match(key);
  if (!cached) {
    try {
      return await network;
    } catch {
      return (await cache.match(OFFLINE_URL)) ?? Response.error();
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
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname === '/_next/image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGES));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  }
});

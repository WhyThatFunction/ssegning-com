'use client';

import { useEffect, useState } from 'react';

// public/sw.js names its page cache `pages-<rules version>`; reading every
// such cache keeps this list working when that version is bumped.
const PAGE_CACHE_PREFIX = 'pages-';
// Titles end in " — <site name>" (layout.tsx). Only the last one is cut, so a
// title with its own dash keeps it.
const TITLE_SUFFIX = / — [^—]*$/;

interface CachedPage {
  path: string;
  title: string;
}

async function readCachedPages(): Promise<CachedPage[]> {
  if (!('caches' in window)) return [];
  const names = (await caches.keys()).filter((name) => name.startsWith(PAGE_CACHE_PREFIX));
  const entries = (
    await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        return (await cache.keys()).map((request) => ({ cache, request }));
      }),
    )
  ).flat();
  const parser = new DOMParser();

  const pages = await Promise.all(
    entries.map(async ({ cache, request }): Promise<CachedPage | null> => {
      const url = new URL(request.url);
      if (url.origin !== window.location.origin || url.pathname === '/offline') return null;
      const response = await cache.match(request);
      if (!response) return null;
      const html = await response.text();
      const title = parser.parseFromString(html, 'text/html').title.replace(TITLE_SUFFIX, '');
      return { path: url.pathname + url.search, title: title || url.pathname };
    }),
  );

  return pages
    .filter((page): page is CachedPage => page !== null)
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * The pages the service worker has saved on this device, read straight from
 * its cache, so the offline page offers a way forward instead of a dead end.
 * Renders nothing until it has read the cache, and nothing if it is empty.
 */
export function CachedPages() {
  const [pages, setPages] = useState<CachedPage[]>([]);

  useEffect(() => {
    readCachedPages()
      .then(setPages)
      .catch(() => setPages([]));
  }, []);

  if (pages.length === 0) return null;

  return (
    <section aria-labelledby="saved-on-this-device" className="mt-14">
      <h2
        id="saved-on-this-device"
        className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
      >
        Saved on this device
      </h2>
      <ul className="mt-4">
        {pages.map((page) => (
          <li key={page.path}>
            {/* A plain anchor, not next/link: a full page load is what the service worker answers offline. */}
            <a
              href={page.path}
              className="group -mx-4 flex items-baseline justify-between gap-6 rounded-input border-b border-border px-4 py-4 transition-colors duration-150 ease-out hover:bg-surface-1"
            >
              <span className="text-base text-ink text-balance group-hover:text-accent">
                {page.title}
              </span>
              <span className="font-mono text-xs text-ink-muted">{page.path}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

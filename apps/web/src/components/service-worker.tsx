'use client';

import { useEffect } from 'react';

/**
 * Registers public/sw.js, which keeps pages a reader has opened available
 * offline. Production only: in `next dev` a worker caching /_next/static
 * would serve stale bundles across reloads.
 *
 * `updateViaCache: 'none'` makes the browser fetch sw.js itself past the HTTP
 * cache on every update check, so a new worker is picked up on the next
 * visit after a deploy.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // A failed registration only means no offline copies; the site works the same.
    });
  }, []);

  return null;
}

import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { Section } from '@/components/section';

import { CachedPages } from './cached-pages';

export const metadata: Metadata = {
  title: 'Offline',
  // Only ever served by the service worker in place of a page it could not
  // fetch; there is nothing here for a search engine.
  robots: { index: false, follow: false },
};

/**
 * Shown by the service worker (public/sw.js) when a reader opens a page with
 * no connection and no saved copy of it. Fetched once when the worker
 * installs, so it is the one page guaranteed to be available offline.
 */
export default function OfflinePage() {
  return (
    <Section divider={false} className="pt-24 md:pt-32">
      <Container>
        <p className="font-mono text-caption uppercase tracking-[0.08em] text-accent">Offline</p>
        <h1 className="mt-3 text-heading-lg font-light tracking-tight text-ink">
          No connection right now.
        </h1>
        <p className="mt-3 max-w-md text-ink-muted">
          This page hasn't been saved on this device yet. Pages you've already read still open
          without a connection.
        </p>
        <CachedPages />
      </Container>
    </Section>
  );
}

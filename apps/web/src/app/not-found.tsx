import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { LinkButton } from '@/components/link-button';
import { Section } from '@/components/section';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <Section divider={false} className="pt-24 md:pt-32">
      <Container>
        <p className="font-mono text-caption uppercase tracking-[0.08em] text-accent">404</p>
        <h1 className="mt-3 text-heading-lg font-medium tracking-tight text-ink">
          That page doesn't exist.
        </h1>
        <p className="mt-3 max-w-md text-ink-muted">
          The link might be out of date, or the page may have moved. Try the homepage, or head
          straight to the work that's still there.
        </p>
        <div className="mt-8 flex gap-4">
          <LinkButton href="/">Back home</LinkButton>
          <LinkButton href="/work" variant="ghost">
            See the work
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}

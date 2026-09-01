'use client';

import { useEffect } from 'react';

import { Container } from '@/components/container';
import { LinkButton } from '@/components/link-button';
import { Section } from '@/components/section';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section divider={false} className="pt-24 md:pt-32">
      <Container>
        <p className="font-mono text-caption uppercase tracking-[0.08em] text-accent">Error</p>
        <h1 className="mt-3 text-heading-lg font-medium tracking-tight text-ink">
          Something went wrong.
        </h1>
        <p className="mt-3 max-w-md text-ink-muted">
          That's on this end, not yours. You can try again, or head back to the homepage.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-control border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors duration-150 ease-out hover:bg-accent hover:text-accent-ink"
          >
            Try again
          </button>
          <LinkButton href="/" variant="ghost">
            Back home
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}

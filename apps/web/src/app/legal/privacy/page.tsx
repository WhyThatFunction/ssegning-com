import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { Markdown } from '@/components/markdown';
import { Section } from '@/components/section';
import { legalPage as fallbackLegalPage } from '@/content/fallback';
import { getLegalPage } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;

export default async function PrivacyPage() {
  const page = (await getLegalPage()) ?? fallbackLegalPage;
  const body = page.privacy ?? fallbackLegalPage.privacy ?? '';

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <Container>
        <Markdown>{body}</Markdown>
      </Container>
    </Section>
  );
}

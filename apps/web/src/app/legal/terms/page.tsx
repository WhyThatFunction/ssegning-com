import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { Markdown } from '@/components/markdown';
import { Section } from '@/components/section';
import { getLegalPage } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

// ISR: regenerate at most once a minute. A regeneration that throws (the CMS
// did not answer, see CmsUnavailableError) keeps the last good copy.
export const revalidate = 60;

export default async function TermsPage() {
  const page = await getLegalPage();
  const body = page.terms ?? '';

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <Container>
        <Markdown>{body}</Markdown>
      </Container>
    </Section>
  );
}

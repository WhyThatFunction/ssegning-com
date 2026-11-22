import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { Markdown } from '@/components/markdown';
import { Section } from '@/components/section';
import { getLegalPage } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Imprint',
};

// ISR: regenerate at most once a minute. A regeneration that throws (the CMS
// did not answer, see CmsUnavailableError) keeps the last good copy.
export const revalidate = 60;

export default async function ImprintPage() {
  const page = await getLegalPage();
  const body = page.imprint ?? '';

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <Container>
        <Markdown>{body}</Markdown>
      </Container>
    </Section>
  );
}

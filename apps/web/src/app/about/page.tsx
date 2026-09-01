import type { Metadata } from 'next';
import Image from 'next/image';

import { Container } from '@/components/container';
import { Markdown } from '@/components/markdown';
import { MetricStrip } from '@/components/metric-strip';
import { Section } from '@/components/section';
import { aboutPage as fallbackAboutPage } from '@/content/fallback';
import { mediaAlt, resolveMediaUrl } from '@/lib/media';
import { getAboutPage } from '@/lib/strapi';

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const about = (await getAboutPage()) ?? fallbackAboutPage;
  return {
    title: 'About',
    description: about.seo?.metaDescription ?? `${about.name}, ${about.role ?? 'consultant'}.`,
  };
}

export default async function AboutPage() {
  const page = (await getAboutPage()) ?? fallbackAboutPage;
  const portraitUrl = resolveMediaUrl(page.portrait);

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <Container>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start">
          <div>
            {portraitUrl ? (
              <div className="relative aspect-square overflow-hidden rounded-card border border-border">
                <Image
                  src={portraitUrl}
                  alt={mediaAlt(page.portrait, page.name)}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : null}
            <h1 className="mt-6 text-heading-lg font-medium tracking-tight text-ink">
              {page.name}
            </h1>
            {page.role ? <p className="mt-1 text-ink-muted">{page.role}</p> : null}
          </div>

          <div>{page.bio ? <Markdown>{page.bio}</Markdown> : null}</div>
        </div>

        {page.highlights.length > 0 ? (
          <div className="mt-16">
            <MetricStrip metrics={page.highlights} />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

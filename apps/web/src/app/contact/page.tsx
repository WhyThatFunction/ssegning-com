import { Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { LinkButton } from '@/components/link-button';
import { Markdown } from '@/components/markdown';
import { Section } from '@/components/section';
import { contactPage as fallbackContactPage } from '@/content/fallback';
import { getContactPage } from '@/lib/strapi';

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const contact = (await getContactPage()) ?? fallbackContactPage;
  return {
    title: 'Contact',
    description: contact.seo?.metaDescription ?? contact.headline ?? 'Get in touch.',
  };
}

export default async function ContactPage() {
  const page = (await getContactPage()) ?? fallbackContactPage;

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <Container>
        <div className="grid gap-12 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            {page.headline ? (
              <h1 className="text-display font-medium tracking-tight text-balance text-ink">
                {page.headline}
              </h1>
            ) : null}
            {page.body ? (
              <div className="mt-6">
                <Markdown>{page.body}</Markdown>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-4">
              {page.email ? <LinkButton href={`mailto:${page.email}`}>Email me</LinkButton> : null}
              {page.bookingUrl ? (
                <LinkButton href={page.bookingUrl} external variant="ghost">
                  Book a call
                </LinkButton>
              ) : null}
            </div>
          </div>

          <dl className="h-fit space-y-6 rounded-card border border-border p-6 font-mono text-sm">
            {page.email ? (
              <div className="flex items-start gap-3">
                <Mail
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  strokeWidth={1.5}
                />
                <div>
                  <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">Email</dt>
                  <dd className="mt-1 text-ink">
                    <a href={`mailto:${page.email}`} className="hover:text-accent">
                      {page.email}
                    </a>
                  </dd>
                </div>
              </div>
            ) : null}
            {page.phone ? (
              <div className="flex items-start gap-3">
                <Phone
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  strokeWidth={1.5}
                />
                <div>
                  <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">Phone</dt>
                  <dd className="mt-1 text-ink">{page.phone}</dd>
                </div>
              </div>
            ) : null}
            {page.location ? (
              <div className="flex items-start gap-3">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  strokeWidth={1.5}
                />
                <div>
                  <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">Location</dt>
                  <dd className="mt-1 text-ink">{page.location}</dd>
                </div>
              </div>
            ) : null}
          </dl>
        </div>
      </Container>
    </Section>
  );
}

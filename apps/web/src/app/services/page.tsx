import type { Metadata } from 'next';

import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';
import { ServiceCard } from '@/components/service-card';
import { StatusLine } from '@/components/status-line';
import { services as fallbackServices } from '@/content/fallback';
import { getServices } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Kubernetes platform builds, Rust and TypeScript backend engineering, cloud cost and reliability audits, and fractional platform ownership.',
};

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;

export default async function ServicesPage() {
  const services = await getServices();
  const list = services.length > 0 ? services : fallbackServices;

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <SectionHeading
        eyebrow="Services"
        title="What I can take off your plate"
        description="Four ways to work together, each scoped tightly enough that you know exactly what you're getting."
      />
      {list.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {list.map((service) => (
            <ServiceCard key={service.documentId} service={service} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <StatusLine>Services are being updated — check back shortly.</StatusLine>
        </div>
      )}
    </Section>
  );
}

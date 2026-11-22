import type { Metadata } from 'next';

import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';
import { ServiceCard } from '@/components/service-card';
import { StatusLine } from '@/components/status-line';
import { getServices } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Kubernetes platform builds, Rust and TypeScript backend engineering, cloud cost and reliability audits, and fractional platform ownership.',
};

// ISR: regenerate at most once a minute. A regeneration that throws (the CMS
// did not answer, see CmsUnavailableError) keeps the last good copy.
export const revalidate = 60;

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <SectionHeading
        eyebrow="Services"
        title="What I can take off your plate"
        description="Four ways to work together, each scoped tightly enough that you know exactly what you're getting."
      />
      {services.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {services.map((service) => (
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

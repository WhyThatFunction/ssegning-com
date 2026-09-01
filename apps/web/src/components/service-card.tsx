import Link from 'next/link';

import { ServiceIcon } from '@/components/service-icon';
import type { Service } from '@/lib/types';

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services#${service.slug}`}
      id={service.slug}
      className="group block rounded-card border border-border p-6 transition-colors duration-150 ease-out hover:border-border-strong"
    >
      <ServiceIcon name={service.icon} className="h-6 w-6 text-accent" />
      <h3 className="mt-4 text-heading font-medium text-ink">{service.title}</h3>
      {service.summary ? <p className="mt-2 text-sm text-ink-muted">{service.summary}</p> : null}
      {service.deliverables.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {service.deliverables.map((item) => (
            <li key={item.id} className="text-sm text-ink">
              <span className="mr-2 text-accent">—</span>
              {item.text}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
}

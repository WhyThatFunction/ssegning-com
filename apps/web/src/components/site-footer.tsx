import Link from 'next/link';

import { Container } from '@/components/container';
import { SocialLinks } from '@/components/social-links';
import type { SiteSetting } from '@/lib/types';

const legalLinks = [
  { href: '/legal/imprint', label: 'Imprint' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
];

export function SiteFooter({ siteSetting }: { siteSetting: SiteSetting }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <Container wide className="flex flex-col gap-8 py-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="max-w-sm">
            <p className="font-mono text-sm text-ink">{siteSetting.siteName}</p>
            {siteSetting.footerNote ? (
              <p className="mt-2 text-sm text-ink-muted">{siteSetting.footerNote}</p>
            ) : null}
          </div>
          <SocialLinks socials={siteSetting.socials} />
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">
            © {year} {siteSetting.siteName}
          </p>
          <ul className="flex items-center gap-5">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

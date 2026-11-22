import Link from 'next/link';

import { BrandLockup } from '@/components/brand-lockup';
import { Container } from '@/components/container';
import { SocialLinks } from '@/components/social-links';
import { SITE_PAGES } from '@/lib/site-pages';
import type { SiteSetting } from '@/lib/types';

// The reference and legal pages, from the shared page list (lib/site-pages.ts,
// `inFooter`). Not CMS-driven, unlike the header's siteSetting.navLinks: these
// are reference pages, not top-level destinations, so they live here rather
// than in the primary nav.
const moreLinks = SITE_PAGES.filter((page) => page.inFooter);

function ColumnTitle({ children }: { children: string }) {
  return (
    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
      {children}
    </p>
  );
}

const linkClass = 'text-sm text-ink-muted transition-colors duration-150 ease-out hover:text-ink';

/**
 * A directory rather than a legal strip -- the ending both Retool and Linear
 * use: grouped columns of links under small uppercase labels, so the bottom of
 * every page is a place to go next instead of a dead end.
 *
 * Every column is built from data the site already has: the brand and its
 * note, the CMS-managed primary navigation, and the reference and legal pages.
 * No column exists just to make the grid look full.
 */
export function SiteFooter({ siteSetting }: { siteSetting: SiteSetting }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border">
      <Container wide className="flex flex-col gap-14 py-16">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex max-w-sm flex-col gap-4 sm:col-span-2 md:col-span-1">
            <Link href="/" className="self-start text-ink">
              <BrandLockup label={siteSetting.siteName} size={20} />
            </Link>
            {siteSetting.footerNote ? (
              <p className="text-sm text-ink-muted">{siteSetting.footerNote}</p>
            ) : null}
            <SocialLinks socials={siteSetting.socials} />
          </div>

          {siteSetting.navLinks.length > 0 ? (
            <nav aria-label="Site" className="flex flex-col gap-4">
              <ColumnTitle>Site</ColumnTitle>
              <ul className="flex flex-col gap-2.5">
                {siteSetting.navLinks.map((link) => (
                  <li key={link.id}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-label="More" className="flex flex-col gap-4">
            <ColumnTitle>More</ColumnTitle>
            <ul className="flex flex-col gap-2.5">
              {moreLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="border-t border-border pt-6 font-mono text-xs text-ink-muted">
          © {year} {siteSetting.siteName}
        </p>
      </Container>
    </footer>
  );
}

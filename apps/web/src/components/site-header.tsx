import Link from 'next/link';

import { Container } from '@/components/container';
import { MobileNav } from '@/components/mobile-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import type { SiteSetting } from '@/lib/types';

export function SiteHeader({ siteSetting }: { siteSetting: SiteSetting }) {
  return (
    <header className="relative border-b border-border bg-canvas">
      <Container wide className="flex h-16 items-center justify-between">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight text-ink">
          {siteSetting.siteName}
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {siteSetting.navLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className="text-sm text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <MobileNav navLinks={siteSetting.navLinks} />
        </div>
      </Container>
    </header>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteSetting as fallbackSiteSetting } from '@/content/fallback';
import { getSiteSetting } from '@/lib/strapi';

import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ssegning.com';

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('ssegning-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (error) {}
})();
`;

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = (await getSiteSetting()) ?? fallbackSiteSetting;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteSetting.siteName,
      template: `%s — ${siteSetting.siteName}`,
    },
    description: siteSetting.metaDescription ?? siteSetting.tagline ?? undefined,
    openGraph: {
      type: 'website',
      siteName: siteSetting.siteName,
      title: siteSetting.siteName,
      description: siteSetting.metaDescription ?? siteSetting.tagline ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteSetting.siteName,
      description: siteSetting.metaDescription ?? siteSetting.tagline ?? undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const siteSetting = (await getSiteSetting()) ?? fallbackSiteSetting;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Synchronous, inline, and static (no user data) — avoids a flash
            of the wrong theme before hydration. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: THEME_INIT_SCRIPT is a static, hand-written constant above — never user input. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader siteSetting={siteSetting} />
        <main id="main-content">{children}</main>
        <SiteFooter siteSetting={siteSetting} />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { ServiceWorker } from '@/components/service-worker';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getSiteSetting } from '@/lib/strapi';

import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ssegning.com';

// Self-hosted by next/font at build time: no request to Google from a
// reader's browser, and no layout shift while the face loads. Each exposes a
// CSS variable that globals.css puts at the front of its font stack.
//
// DM Sans is variable, so 300 for large headings (hierarchy from scale rather
// than weight) and 500 for small titles come from one file.
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

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
  const siteSetting = await getSiteSetting();

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
  const siteSetting = await getSiteSetting();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${jetbrainsMono.variable}`}
    >
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
        <ServiceWorker />
      </body>
    </html>
  );
}

import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ssegning.com';

const STATIC_ROUTES = [
  '',
  '/services',
  '/work',
  '/about',
  '/journal',
  '/contact',
  '/legal/imprint',
  '/legal/privacy',
  '/legal/terms',
];

/**
 * The site's own pages. Articles and case studies are in the content sitemap
 * the CMS builds (`/sitemap-content.xml`, app/sitemap-content.xml/route.ts),
 * with the date each last changed; listing them here too would give crawlers
 * a second, less accurate date for the same URLs. robots.txt lists both.
 *
 * No `lastModified`: nothing here knows when a hand-built page last changed,
 * and a date that moves on every request is worse than none.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path}` }));
}

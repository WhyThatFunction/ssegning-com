import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ssegning.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    // Pages from this app, and the CMS's content sitemap it proxies
    // (app/sitemap-content.xml/route.ts).
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/sitemap-content.xml`],
  };
}

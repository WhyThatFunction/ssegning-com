/**
 * The site's hand-built pages, in the order a reader would meet them. One
 * list for both places that enumerate them: the XML sitemap crawlers read
 * (app/sitemap.ts) and the sitemap page people read (app/sitemap/page.tsx).
 * Articles and case studies are not here; they come from the CMS.
 */
export const SITE_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/services', label: 'Services' },
  { path: '/work', label: 'Work' },
  { path: '/about', label: 'About' },
  { path: '/journal', label: 'Journal' },
  { path: '/contact', label: 'Contact' },
  { path: '/branding', label: 'Branding' },
  { path: '/sitemap', label: 'Sitemap' },
  { path: '/legal/imprint', label: 'Imprint' },
  { path: '/legal/privacy', label: 'Privacy' },
  { path: '/legal/terms', label: 'Terms' },
] as const;

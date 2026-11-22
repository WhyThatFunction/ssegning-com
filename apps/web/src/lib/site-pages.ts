/**
 * The site's hand-built pages, in the order a reader would meet them. One
 * list for every place that enumerates them: the XML sitemap crawlers read
 * (app/sitemap.ts), the sitemap page people read (app/sitemap/page.tsx) and
 * the footer's "More" column (components/site-footer.tsx, which takes the
 * pages marked `inFooter`: the reference and legal pages).
 * Articles and case studies are not here; they come from the CMS.
 */
export const SITE_PAGES: readonly { path: string; label: string; inFooter?: boolean }[] = [
  { path: '/', label: 'Home' },
  { path: '/services', label: 'Services' },
  { path: '/work', label: 'Work' },
  { path: '/about', label: 'About' },
  { path: '/journal', label: 'Journal' },
  { path: '/contact', label: 'Contact' },
  { path: '/branding', inFooter: true, label: 'Branding' },
  { path: '/sitemap', inFooter: true, label: 'Sitemap' },
  { path: '/legal/imprint', inFooter: true, label: 'Imprint' },
  { path: '/legal/privacy', inFooter: true, label: 'Privacy' },
  { path: '/legal/terms', inFooter: true, label: 'Terms' },
];

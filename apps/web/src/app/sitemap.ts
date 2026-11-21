import type { MetadataRoute } from 'next';

import { getPosts, getProjects } from '@/lib/strapi';

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
 * Rendered per request, never cached.
 *
 * This used to be ISR with `revalidate = 60`, which is wrong for a sitemap in
 * this setup for two compounding reasons. The build runs in CI with no Strapi
 * reachable, so the version baked into the image lists the hand-written
 * fallback articles instead of the real ones. And `web` runs 2 replicas whose
 * ISR caches are per-pod, so after every deploy each pod independently serves
 * that baked copy until its own first revalidation — two clients fetching
 * /sitemap.xml seconds apart got different documents, one of them listing
 * articles that do not exist in the CMS.
 *
 * A sitemap is fetched by crawlers a handful of times a day, so paying one
 * Strapi call per request to always tell the truth is the right trade.
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Deliberately NOT falling back to `@/content/fallback` when Strapi is
  // unreachable, the way the rendered pages do. A page falling back shows a
  // visitor something instead of an error; a sitemap falling back publishes a
  // list of URLs to search engines and asserts they exist. The fallback slugs
  // are not in the CMS, so that assertion is false. If Strapi is down, the
  // honest sitemap is the static routes alone.
  const [projectList, postList] = await Promise.all([getProjects(), getPosts()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const projectEntries: MetadataRoute.Sitemap = projectList.map((project) => ({
    url: `${SITE_URL}/work/${project.slug}`,
    lastModified: new Date(),
  }));

  const postEntries: MetadataRoute.Sitemap = postList.map((post) => ({
    url: `${SITE_URL}/journal/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
  }));

  return [...staticEntries, ...projectEntries, ...postEntries];
}

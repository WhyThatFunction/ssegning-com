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
 * ISR here would let the two `web` replicas, whose caches are per-pod, serve
 * different documents after a deploy. A sitemap is fetched by crawlers a
 * handful of times a day, so one Strapi call per request to always tell the
 * truth is the right trade.
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // If Strapi does not answer, this throws (CmsUnavailableError) and the
  // crawler gets a 500 and retries. A sitemap with only the static routes
  // would tell it every article had gone.
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

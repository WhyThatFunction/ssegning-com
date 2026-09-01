import type { MetadataRoute } from 'next';

import { posts as fallbackPosts, projects as fallbackProjects } from '@/content/fallback';
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

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);
  const projectList = projects.length > 0 ? projects : fallbackProjects;
  const postList = posts.length > 0 ? posts : fallbackPosts;

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

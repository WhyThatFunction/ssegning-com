import type { StrapiMedia } from '@/lib/types';

/**
 * Strapi returns S3 absolute URLs for uploads, but local/dev setups can
 * still return a relative path. Handle both, and handle `null` media
 * everywhere it can occur.
 */
export function resolveMediaUrl(media: StrapiMedia | null | undefined): string | null {
  if (!media?.url) return null;
  if (/^https?:\/\//i.test(media.url)) return media.url;

  const base = process.env.STRAPI_URL ?? '';
  if (!base) return media.url;

  return `${base.replace(/\/$/, '')}${media.url.startsWith('/') ? '' : '/'}${media.url}`;
}

export function mediaAlt(media: StrapiMedia | null | undefined, fallback: string): string {
  return media?.alternativeText?.trim() || fallback;
}

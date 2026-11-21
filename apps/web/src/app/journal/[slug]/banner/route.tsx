import { notFound } from 'next/navigation';

import { renderArticleBanner } from '@/lib/article-banner';
import { getPostBySlug } from '@/lib/strapi';

/**
 * The generated hero banner for one article, at /journal/<slug>/banner.
 *
 * A route handler rather than Next's `opengraph-image` convention, because
 * this image is used in two places — the page renders it as the article's
 * banner, and `generateMetadata` points Open Graph at the same URL. The
 * convention generates a hashed filename that is awkward to reference from
 * markup, while this URL is stable and can be used by both.
 *
 * Cached for a day: the image depends only on the title, the slug and the
 * reading time, so regenerating it per request would be pure waste.
 */
export const revalidate = 86400;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lookup = await getPostBySlug(slug);

  // No banner for an article the CMS does not have. Rendering a placeholder
  // would hand crawlers a valid image for a URL that 404s everywhere else.
  if (lookup.status !== 'found') notFound();

  const post = lookup.value;

  return renderArticleBanner({
    title: post.title,
    slug,
    kicker: 'Journal',
    readingMinutes: post.readingMinutes,
  });
}

import { notFound } from 'next/navigation';

import { renderBanner, SOCIAL_SIZE } from '@/lib/article-banner';
import { CmsUnavailableError, getPostBySlug } from '@/lib/strapi';

export const size = SOCIAL_SIZE;
export const contentType = 'image/png';
export const alt = 'Article banner';

/**
 * The Open Graph card for one article.
 *
 * Unlike the on-page banner (./banner/route.tsx) this one carries the title,
 * because in a feed the image is the whole of what a reader sees — there is no
 * page around it to supply the heading. Next wires this into the page's
 * metadata automatically, so the hashed filename it generates never has to be
 * referenced from markup.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lookup = await getPostBySlug(slug);

  // An unreachable CMS is not a missing article. This route is rendered per
  // request, not cached as a page, so there is no last good card to keep: a
  // 500 tells a crawler to retry, where a 404 told it the card is gone.
  if (lookup.status === 'unavailable') throw new CmsUnavailableError(`the card for "${slug}"`);
  if (lookup.status === 'missing') notFound();

  const post = lookup.value;

  return renderBanner({
    title: post.title,
    seed: slug,
    kicker: 'Journal',
    subtitle: post.excerpt,
    footerNote: post.readingMinutes ? `${post.readingMinutes} min read` : null,
  });
}

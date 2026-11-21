import { notFound } from 'next/navigation';

import { renderBanner, SOCIAL_SIZE } from '@/lib/article-banner';
import { CmsUnavailableError, getProjectBySlug } from '@/lib/strapi';

export const size = SOCIAL_SIZE;
export const contentType = 'image/png';
export const alt = 'Case study';

/** The Open Graph card for one case study. Same renderer as the journal's. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lookup = await getProjectBySlug(slug);

  // An unreachable CMS is not a missing project. This route is rendered per
  // request, not cached as a page, so there is no last good card to keep: a
  // 500 tells a crawler to retry, where a 404 told it the card is gone.
  if (lookup.status === 'unavailable') throw new CmsUnavailableError(`the card for "${slug}"`);
  if (lookup.status === 'missing') notFound();

  const project = lookup.value;

  return renderBanner({
    title: project.title,
    seed: slug,
    kicker: 'Work',
    subtitle: project.summary,
  });
}

import { notFound } from 'next/navigation';

import { renderBanner, SOCIAL_SIZE } from '@/lib/article-banner';
import { getProjectBySlug } from '@/lib/strapi';

export const size = SOCIAL_SIZE;
export const contentType = 'image/png';
export const alt = 'Case study';

/** The Open Graph card for one case study. Same renderer as the journal's. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lookup = await getProjectBySlug(slug);

  if (lookup.status !== 'found') notFound();

  const project = lookup.value;

  return renderBanner({
    title: project.title,
    seed: slug,
    kicker: 'Work',
    subtitle: project.summary,
  });
}

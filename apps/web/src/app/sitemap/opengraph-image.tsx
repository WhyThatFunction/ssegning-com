import { SOCIAL_SIZE } from '@/lib/article-banner';
import { renderPageOg } from '@/lib/page-og';

export const size = SOCIAL_SIZE;
export const contentType = 'image/png';
export const alt = 'Sitemap — Stephane Segning Lambou';

export default async function Image() {
  return renderPageOg({
    title: 'Sitemap',
    seed: 'sitemap',
    subtitle: 'Every page, article and case study on ssegning.com.',
  });
}

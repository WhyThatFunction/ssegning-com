import { SOCIAL_SIZE } from '@/lib/article-banner';
import { renderPageOg } from '@/lib/page-og';

export const size = SOCIAL_SIZE;
export const contentType = 'image/png';
export const alt = 'Journal — Stephane Segning Lambou';

export default async function Image() {
  return renderPageOg({
    title: 'Journal',
    seed: 'journal',
    subtitle: 'Notes on Kubernetes, Rust, TypeScript, and running production infrastructure.',
  });
}

import { siteSetting as fallbackSiteSetting } from '@/content/fallback';
import { getSiteSetting } from '@/lib/strapi';

import { renderBanner } from './article-banner';

/**
 * The Open Graph card for a static page.
 *
 * Shares one renderer with the journal cards (`renderBanner`) so every link
 * this site produces looks like it came from the same place — the same brand
 * geometry, the same type, the same footer. What differs is the seed, which
 * is the route key: each page gets its own stable composition, and it never
 * changes between deploys.
 *
 * `subtitle` falls back to the site tagline because most of these pages have
 * no meta description of their own, and a card carrying a lone word ("About")
 * tells a reader nothing about what they are being sent to.
 */
export async function renderPageOg({
  title,
  seed,
  subtitle,
}: {
  title: string;
  seed: string;
  subtitle?: string | null;
}) {
  const siteSetting = (await getSiteSetting()) ?? fallbackSiteSetting;

  return renderBanner({
    title,
    seed,
    kicker: siteSetting.siteName,
    subtitle: subtitle ?? siteSetting.tagline,
  });
}

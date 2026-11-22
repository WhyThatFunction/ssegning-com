import { getContentSitemapXml } from '@/lib/strapi';

/**
 * `/sitemap-content.xml`: the CMS's content sitemap (every published article
 * and case study, with its last-modified date and images), served on this
 * site's own domain so crawlers accept it for these URLs. robots.txt lists it
 * next to `/sitemap.xml`.
 *
 * Fetched per request: the sitemap is read a handful of times a day, and the
 * CMS is the one that knows what changed. If the CMS does not answer, the
 * crawler gets a 503 with Retry-After, never an empty or partial sitemap.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const xml = await getContentSitemapXml();
  if (!xml) {
    return new Response('Content sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

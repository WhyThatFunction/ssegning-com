import type { Core } from '@strapi/strapi';

interface Origins {
  /** The public site, e.g. https://ssegning.com. Every <loc> is under it. */
  siteUrl: string;
  /** This CMS's public URL, for media Strapi stores with a relative path. */
  cmsUrl: string;
}

interface Media {
  url?: string | null;
}

interface PublishedEntry {
  slug: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
  cover?: Media | null;
  body?: string | null;
}

interface DocNode {
  type: string;
  attrs?: { src?: unknown };
  content?: DocNode[];
}

const PAGE_SIZE = 100;

/** Every published entry of a collection, page by page. */
async function allPublished(
  strapi: Core.Strapi,
  uid: 'api::post.post' | 'api::project.project',
  fields: string[],
): Promise<PublishedEntry[]> {
  const entries: PublishedEntry[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const page = (await strapi.documents(uid).findMany({
      status: 'published',
      fields,
      populate: { cover: { fields: ['url'] } },
      sort: 'publishedAt:desc',
      start,
      limit: PAGE_SIZE,
    } as never)) as unknown as PublishedEntry[];
    entries.push(...page);
    if (page.length < PAGE_SIZE) return entries;
  }
}

/** The `src` of every image in a stored Tiptap document, in order. */
function bodyImages(body: string | null | undefined): string[] {
  if (!body) return [];
  let doc: DocNode;
  try {
    doc = JSON.parse(body) as DocNode;
  } catch {
    return [];
  }
  const sources: string[] = [];
  const walk = (node: DocNode) => {
    if (node.type === 'image' && typeof node.attrs?.src === 'string') sources.push(node.attrs.src);
    for (const child of node.content ?? []) walk(child);
  };
  walk(doc);
  return sources;
}

/** Makes a URL absolute: article images are site paths, uploads may be CMS paths. */
function absolute(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod: string | null | undefined, images: string[]): string {
  const lines = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>`);
  for (const image of [...new Set(images)]) {
    lines.push(`    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`);
  }
  lines.push(`  </url>`);
  return lines.join('\n');
}

/**
 * The content sitemap: every published article and case study, with the date
 * it last changed in the CMS and the images it shows (the article's own
 * illustrations and its cover), so search engines can find those too.
 */
export async function buildContentSitemap(strapi: Core.Strapi, origins: Origins): Promise<string> {
  const site = origins.siteUrl.replace(/\/$/, '');
  const [posts, projects] = await Promise.all([
    allPublished(strapi, 'api::post.post', ['slug', 'updatedAt', 'publishedAt', 'body']),
    allPublished(strapi, 'api::project.project', ['slug', 'updatedAt', 'publishedAt']),
  ]);

  const images = (entry: PublishedEntry) =>
    [
      ...bodyImages(entry.body).map((src) => absolute(src, `${site}/`)),
      entry.cover?.url ? absolute(entry.cover.url, `${origins.cmsUrl.replace(/\/$/, '')}/`) : null,
    ].filter((url): url is string => url !== null);

  const entries = [
    ...posts.map((post) =>
      urlEntry(`${site}/journal/${post.slug}`, post.updatedAt ?? post.publishedAt, images(post)),
    ),
    ...projects.map((project) =>
      urlEntry(
        `${site}/work/${project.slug}`,
        project.updatedAt ?? project.publishedAt,
        images(project),
      ),
    ),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

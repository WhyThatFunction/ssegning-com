import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Core } from '@strapi/strapi';
import { markdownToHtml } from '../lib/markdown-to-html';

const ARTICLES_DIR = join(__dirname, 'articles');

const WORDS_PER_MINUTE = 200;
const EXCERPT_MAX_LENGTH = 200;
const META_DESCRIPTION_MAX_LENGTH = 155;

/**
 * All 12 articles to publish, and the order to publish them in.
 *
 * This is the author's own "Full interleaved calendar" from
 * `~/dev/articles/RELEASE.md` (week 1 -> 12: the 8-piece "Hold My GPU" series
 * woven together with the 4 standalone free topics), NOT the `NN-` filename
 * prefix (which is creation order — see `~/dev/articles/README.md`: "File
 * numbers are creation order, not reading order"). RELEASE.md's hard rules
 * are preserved by construction here: #1/#2 stay adjacent, the gateway
 * ("Everything Everywhere All at Once") and auth ("The Multiverse of Secure
 * AI") pieces stay adjacent, and the finale ("Pandora's Bucket") is last.
 *
 * `publishedAt` is assigned in ascending, one-week-apart order matching this
 * same reading sequence, so `GET /api/posts?sort=publishedAt:desc` (the
 * contract apps/web relies on) surfaces the newest/final piece (the finale)
 * first while the full reading order remains recoverable by reversing the
 * list — the ordering is data (publishedAt), not just file layout.
 */
const RELEASE_ORDER: ReadonlyArray<{ file: string; publishedAt: string }> = [
  { file: '01-gpu-plus-vllm-and-youre-done.md', publishedAt: '2026-06-15T09:00:00.000Z' },
  { file: '02-i-almost-bought-five-v100s.md', publishedAt: '2026-06-22T09:00:00.000Z' },
  { file: '10-git-hog-day.md', publishedAt: '2026-06-29T09:00:00.000Z' },
  { file: '06-i-developer-three-laws.md', publishedAt: '2026-07-06T09:00:00.000Z' },
  { file: '05-who-reviews-the-reviewers.md', publishedAt: '2026-07-13T09:00:00.000Z' },
  { file: '04-across-the-plugin-verse.md', publishedAt: '2026-07-20T09:00:00.000Z' },
  { file: '09-the-three-node-problem.md', publishedAt: '2026-07-27T09:00:00.000Z' },
  { file: '07-everything-everywhere-all-at-once.md', publishedAt: '2026-08-03T09:00:00.000Z' },
  { file: '03-just-point-it-at-the-url.md', publishedAt: '2026-08-10T09:00:00.000Z' },
  { file: '08-the-multiverse-of-secure-ai.md', publishedAt: '2026-08-17T09:00:00.000Z' },
  { file: '11-no-country-for-old-packets.md', publishedAt: '2026-08-24T09:00:00.000Z' },
  { file: '12-pandoras-bucket.md', publishedAt: '2026-08-31T09:00:00.000Z' },
];

interface ParsedArticle {
  slug: string;
  title: string;
  body: string;
  excerpt: string;
  readingMinutes: number;
  publishedAt: string;
}

/** Strips the filename's creation-order `NN-` prefix and `.md` extension to get the slug. */
function slugFromFilename(file: string): string {
  return file.replace(/\.md$/, '').replace(/^\d+-/, '');
}

/** Flattens light Markdown emphasis/quote markup to plain prose for use in excerpts/meta text. */
function flattenMarkdown(text: string): string {
  // Collapse to a single line FIRST — the belief/reality blockquote wraps its
  // *italic* span across multiple `>`-prefixed lines, and a naive `.+?` match
  // (no `s` flag) can't cross the embedded newline.
  const singleLine = text.replace(/^>\s?/gm, '').replace(/\s+/g, ' ').trim();

  return singleLine
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim();
}

/** Truncates to `maxLength` at a word boundary, appending an ellipsis when cut short. */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

/**
 * Parses one bundled article's Markdown into the shape the `post` content
 * type expects: title/body split from the leading H1, an excerpt distilled
 * from the leading belief/reality blockquote, and a reading-time estimate.
 */
function parseArticle(file: string, publishedAt: string): ParsedArticle {
  const raw = readFileSync(join(ARTICLES_DIR, file), 'utf-8');
  const lines = raw.split('\n');

  const titleLineIndex = lines.findIndex((line) => line.startsWith('# '));
  if (titleLineIndex === -1) {
    throw new Error(`[bootstrap/articles] ${file} has no leading "# " H1`);
  }
  const title = lines[titleLineIndex].replace(/^#\s+/, '').trim();

  // Body = everything except the H1 line itself (a duplicate H1 would be
  // both ugly and an accessibility problem, since the page renders its own
  // title). Collapse the blank line the H1 leaves behind.
  const body = [...lines.slice(0, titleLineIndex), ...lines.slice(titleLineIndex + 1)]
    .join('\n')
    .replace(/^\s+/, '');

  // The leading belief/reality blockquote: the first contiguous run of
  // `>`-prefixed lines after the H1 (skipping the blank line between them).
  const blockquoteLines: string[] = [];
  let inBlockquote = false;
  for (let i = titleLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('>')) {
      blockquoteLines.push(line);
      inBlockquote = true;
    } else if (inBlockquote) {
      break;
    }
  }
  const excerptSource = flattenMarkdown(blockquoteLines.join('\n'));
  const excerpt = truncate(excerptSource, EXCERPT_MAX_LENGTH);

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

  return {
    slug: slugFromFilename(file),
    title,
    body,
    excerpt,
    readingMinutes,
    publishedAt,
  };
}

/**
 * Publishes the 12 bundled articles as `post` entries, on every
 * boot. Creates a post only when no post with that slug exists yet — never
 * updates or overwrites one, so the author can freely edit a published post
 * in Strapi without a pod restart reverting it. Never throws: a failure here
 * must not block boot.
 */
export async function publishBundledArticles(strapi: Core.Strapi): Promise<void> {
  let created = 0;
  let skipped = 0;

  for (const { file, publishedAt } of RELEASE_ORDER) {
    try {
      const article = parseArticle(file, publishedAt);

      const existing = await strapi.documents('api::post.post').findFirst({
        filters: { slug: article.slug },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // `excerpt` and `readingMinutes` stay derived from `article.body`
      // (the raw Markdown) — both `flattenMarkdown` and the word-count
      // estimate above are tuned for Markdown's own emphasis/quote syntax,
      // not HTML tags, so only the `body` written to Strapi gets converted.
      const createdPost = await strapi.documents('api::post.post').create({
        status: 'published',
        data: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          body: markdownToHtml(article.body),
          readingMinutes: article.readingMinutes,
          seo: {
            metaTitle: article.title,
            metaDescription: truncate(article.excerpt, META_DESCRIPTION_MAX_LENGTH),
          },
        },
      });

      // The Document Service always stamps `publishedAt` with "now" on
      // create, ignoring any value passed in `data` above — so the release
      // date from RELEASE_ORDER is applied as a follow-up write straight
      // through the low-level query layer (which has no such override),
      // the same technique used to backdate/schedule entries in Strapi.
      // This is what makes `GET /api/posts?sort=publishedAt:desc` actually
      // reproduce RELEASE_ORDER instead of relying on the incidental
      // (correct today, but undocumented) ordering of sequential `create()`
      // timestamps.
      await strapi.db.query('api::post.post').update({
        where: { id: createdPost.id },
        data: { publishedAt: article.publishedAt },
      });

      created++;
      strapi.log.info(`[bootstrap/articles] created post "${article.slug}"`);
    } catch (error) {
      strapi.log.error(
        `[bootstrap/articles] failed to publish ${file}: ${(error as Error).message}`,
      );
    }
  }

  strapi.log.info(`[bootstrap/articles] done — created ${created}, skipped ${skipped}`);
}

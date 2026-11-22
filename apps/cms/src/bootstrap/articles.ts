import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { markdownToTiptapJson } from '@ssegning/tiptap-schema';
import type { Core } from '@strapi/strapi';

const ARTICLES_DIR = join(__dirname, 'articles');

const WORDS_PER_MINUTE = 200;
const EXCERPT_MAX_LENGTH = 200;
const META_DESCRIPTION_MAX_LENGTH = 155;

/**
 * Every bundled article to publish, and the order to publish them in.
 *
 * This is the author's own "Full interleaved calendar" from
 * `~/dev/articles/RELEASE.md` (week 1 -> 12: the 8-piece "Hold My GPU" series
 * woven together with the 4 standalone free topics), plus any later free
 * topic appended after the finale, NOT the `NN-` filename
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
interface Release {
  file: string;
  publishedAt: string;
  /**
   * `fingerprint()`s of posts this version of the file may replace: what
   * earlier bundled versions wrote. A post is only rewritten while its draft
   * and its published copy both still match one of them, so an edit made in
   * the Strapi admin, to any field the publisher writes, is never overwritten
   * by a deploy.
   */
  replaces?: readonly string[];
}

/**
 * The `fingerprint()` of each live article before the 2026-11-22 visuals
 * revamp, which gave every article a lead illustration, graphs of its own
 * numbers where it has numbers, and readable diagrams. Each live post was
 * checked field by field against what the publisher generated from its
 * bundled file, so none of these fingerprints covers an admin edit.
 */
const REVAMP_V1: Readonly<Record<string, string>> = {
  '01-gpu-plus-vllm-and-youre-done.md':
    'bbac73c0a92781d98093469c184b3c4cb8b6be3c8de3aaf5f65eed2eb4a9244e',
  '02-i-almost-bought-five-v100s.md':
    '3308e890bf0b196b614447da94789a37c455bdcf5e9ebb8cce8ecf94aa650f64',
  '03-just-point-it-at-the-url.md':
    '19d8f1e7163c3b8788fe4c5c00ba3f434ac962ab1f8f1fd3b75d646cf22dbdbd',
  '04-across-the-plugin-verse.md':
    'a39007fd5c20e2e240a1801ada9946ff29cf174a701a9b77ed33f11bd6eb784e',
  '05-who-reviews-the-reviewers.md':
    '8847a1bd7a70b6a9b4959ba24a342d45ecc0c0dd655bc2eea74ecf9bcf00b5ac',
  '06-i-developer-three-laws.md':
    'a0bb6042c736a6a251ce4f5a9872f3357a9935bbfd4f27ae6bceaffbf4f049dd',
  '07-everything-everywhere-all-at-once.md':
    '2c3d4d132aebbed7d8268054486a1ef25feabee93d11c3d098543f5f71230ea5',
  '08-the-multiverse-of-secure-ai.md':
    '77d79197fea911449723fe95e91879514e4a1d543e6f805c18959af89617c3c4',
  '09-the-three-node-problem.md':
    '87ac0b683e32a64fd2cad30277d67c5f36597d283b63b693c8b6fa9461fa02e0',
  '10-git-hog-day.md': '414874b0b6154ac81fe6d9f81eb1a51f0f21854850ef35d745f1fa85b9e2b2c7',
  '11-no-country-for-old-packets.md':
    'd8a271010b7f912c273386e56dba6d6436693ff88242d4d104b27574dfbf7239',
  '12-pandoras-bucket.md': '4b7b1273ceca6abd54621347a6b15d2807bcee52c30f7f04ebf8682338790c48',
  '13-mad-max-fury-load.md': 'd1fc739325d7d9cb0a47c5dbd63f1805db20e797be04ead27d589e4faa496475',
};

const RELEASE_ORDER: ReadonlyArray<Release> = [
  {
    file: '01-gpu-plus-vllm-and-youre-done.md',
    publishedAt: '2026-06-15T09:00:00.000Z',
    replaces: [REVAMP_V1['01-gpu-plus-vllm-and-youre-done.md']],
  },
  {
    file: '02-i-almost-bought-five-v100s.md',
    publishedAt: '2026-06-22T09:00:00.000Z',
    replaces: [REVAMP_V1['02-i-almost-bought-five-v100s.md']],
  },
  {
    file: '10-git-hog-day.md',
    publishedAt: '2026-06-29T09:00:00.000Z',
    replaces: [REVAMP_V1['10-git-hog-day.md']],
  },
  {
    file: '06-i-developer-three-laws.md',
    publishedAt: '2026-07-06T09:00:00.000Z',
    replaces: [REVAMP_V1['06-i-developer-three-laws.md']],
  },
  {
    file: '05-who-reviews-the-reviewers.md',
    publishedAt: '2026-07-13T09:00:00.000Z',
    replaces: [REVAMP_V1['05-who-reviews-the-reviewers.md']],
  },
  {
    file: '04-across-the-plugin-verse.md',
    publishedAt: '2026-07-20T09:00:00.000Z',
    replaces: [REVAMP_V1['04-across-the-plugin-verse.md']],
  },
  {
    file: '09-the-three-node-problem.md',
    publishedAt: '2026-07-27T09:00:00.000Z',
    replaces: [REVAMP_V1['09-the-three-node-problem.md']],
  },
  {
    file: '07-everything-everywhere-all-at-once.md',
    publishedAt: '2026-08-03T09:00:00.000Z',
    replaces: [REVAMP_V1['07-everything-everywhere-all-at-once.md']],
  },
  {
    file: '03-just-point-it-at-the-url.md',
    publishedAt: '2026-08-10T09:00:00.000Z',
    replaces: [REVAMP_V1['03-just-point-it-at-the-url.md']],
  },
  {
    file: '08-the-multiverse-of-secure-ai.md',
    publishedAt: '2026-08-17T09:00:00.000Z',
    replaces: [REVAMP_V1['08-the-multiverse-of-secure-ai.md']],
  },
  {
    file: '11-no-country-for-old-packets.md',
    publishedAt: '2026-08-24T09:00:00.000Z',
    replaces: [REVAMP_V1['11-no-country-for-old-packets.md']],
  },
  {
    file: '12-pandoras-bucket.md',
    publishedAt: '2026-08-31T09:00:00.000Z',
    replaces: [REVAMP_V1['12-pandoras-bucket.md']],
  },
  // Free topic, dropped after the finale — RELEASE.md allows exactly this
  // ("trail the last free topic(s) after the finale"), so it does not disturb
  // the series spine above. Being the newest publishedAt, it is what
  // `?sort=publishedAt:desc` now surfaces first.
  {
    file: '13-mad-max-fury-load.md',
    publishedAt: '2026-11-21T09:00:00.000Z',
    replaces: [REVAMP_V1['13-mad-max-fury-load.md']],
  },
  // A project write-up, not part of the belief/reality series: how adam-rs
  // was built. Part 2 will follow it.
  {
    file: '14-building-adam-rs-part-1.md',
    publishedAt: '2026-11-22T09:00:00.000Z',
    // The first published version, text only (#21); this one adds the
    // diagrams and illustrations.
    replaces: ['4cbd3b64893cf62572704a078507ccc8c4608a521bdb8e0ba30920542596bdc5'],
  },
  // Free topic, written by Claude with the owner as co-author: the two days
  // of work on this site, told through the questions an agent should and
  // should not ask.
  {
    file: '15-the-bot-who-asked-too-much.md',
    publishedAt: '2026-11-22T14:00:00.000Z',
  },
  // adam-rs write-up, part 2: the second benchmark and a sceptical reading of
  // it. Follows part 1 (14-building-adam-rs-part-1.md).
  {
    file: '16-building-adam-rs-part-2.md',
    publishedAt: '2026-11-22T17:30:00.000Z',
  },
];

interface ParsedArticle {
  slug: string;
  title: string;
  body: string;
  /** Everything below the H1, the only part the excerpt is read from. */
  lead: string;
  readingMinutes: number;
  publishedAt: string;
}

/** Strips the filename's creation-order `NN-` prefix and `.md` extension to get the slug. */
function slugFromFilename(file: string): string {
  return file.replace(/\.md$/, '').replace(/^\d+-/, '');
}

/** Truncates to `maxLength` at a word boundary, appending an ellipsis when cut short. */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

/** A node of the Tiptap document `markdownToTiptapJson` produces. */
interface DocNode {
  type: string;
  text?: string;
  marks?: { type: string }[];
  content?: DocNode[];
}

/** The visible text of a node: marks, link targets and images contribute nothing. */
function textOf(node: DocNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return ' ';
  // Inline content of a paragraph joins as written; block children of a
  // blockquote are separate sentences and need a space between them.
  return (node.content ?? []).map(textOf).join(node.type === 'paragraph' ? '' : ' ');
}

/** Whitespace collapsed to single spaces, trimmed. */
function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * A paragraph that is only emphasis, such as `*Part 1 of 2*` or `**Contents**`:
 * a label above the prose, not the prose itself.
 */
function isLabel(node: DocNode): boolean {
  const texts = (node.content ?? []).filter((child) => child.type === 'text');
  return (
    texts.length > 0 &&
    texts.every((child) =>
      (child.marks ?? []).some((mark) => mark.type === 'bold' || mark.type === 'italic'),
    )
  );
}

/**
 * The excerpt, from the document converted from everything below the H1.
 *
 * A blockquote that leads the article, with nothing but labels before it,
 * wins: that is the series' belief/reality pair. Otherwise it is the first
 * paragraph that is not just an emphasised label. Reading the parsed document rather than
 * Markdown lines keeps list markers, table rows, code and link URLs out of a
 * paragraph; a blockquote contributes all of its text, including any list or
 * code inside it. An article with no prose gives an empty excerpt.
 */
function excerptFromDoc(doc: DocNode): string {
  const nodes = doc.content ?? [];
  const isProse = (node: DocNode) =>
    (node.type === 'blockquote' || node.type === 'paragraph') &&
    clean(textOf(node)) !== '' &&
    !(node.type === 'paragraph' && isLabel(node));

  const first = nodes.find((node) => node.type === 'heading' || isProse(node));
  if (first?.type === 'blockquote') return truncate(clean(textOf(first)), EXCERPT_MAX_LENGTH);

  const paragraph = nodes.find(
    (node) => node.type === 'paragraph' && clean(textOf(node)) && !isLabel(node),
  );
  return paragraph ? truncate(clean(textOf(paragraph)), EXCERPT_MAX_LENGTH) : '';
}

/**
 * Parses one bundled article's Markdown into the shape the `post` content
 * type expects: title/body split from the leading H1 and a reading-time
 * estimate. The excerpt is read from the converted document (excerptFromDoc).
 */
function parseArticle(file: string, publishedAt: string): ParsedArticle {
  // An editor-saved byte-order mark would hide the leading `# ` H1.
  const raw = readFileSync(join(ARTICLES_DIR, file), 'utf-8').replace(/^\uFEFF/, '');
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

  // Diagram source and image syntax are not read as words.
  const prose = body.replace(/```mermaid[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  const wordCount = prose.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

  return {
    slug: slugFromFilename(file),
    title,
    body,
    lead: lines.slice(titleLineIndex + 1).join('\n'),
    readingMinutes,
    publishedAt,
  };
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * One hash over every field the publisher writes. An edit in the Strapi admin
 * to any of them (title, excerpt, body, reading time, SEO title or
 * description) changes it, so `replaces` only ever matches a post nobody has
 * touched since the publisher wrote it.
 */
export function fingerprint(post: Record<string, unknown> | null | undefined): string | null {
  if (!post || typeof post.body !== 'string') return null;
  const seo = (post.seo ?? {}) as Record<string, unknown>;
  return sha256(
    JSON.stringify([
      post.title ?? null,
      post.excerpt ?? null,
      post.body,
      post.readingMinutes ?? null,
      seo.metaTitle ?? null,
      seo.metaDescription ?? null,
    ]),
  );
}

/** What the publisher writes for one article, on create and on replace alike. */
async function postContent(article: ParsedArticle) {
  // `readingMinutes` counts words in the raw Markdown; the excerpt is read
  // from the converted document, where the parser has already told prose
  // apart from lists, tables, code and link URLs.
  const body = await markdownToTiptapJson(article.body);
  const excerpt = excerptFromDoc(JSON.parse(await markdownToTiptapJson(article.lead)) as DocNode);
  return {
    title: article.title,
    excerpt,
    body,
    readingMinutes: article.readingMinutes,
    seo: {
      metaTitle: article.title,
      metaDescription: truncate(excerpt, META_DESCRIPTION_MAX_LENGTH),
    },
  };
}

/**
 * The Document Service stamps `publishedAt` with "now" on create and on
 * publish, ignoring any value passed in — so the release date from
 * RELEASE_ORDER is applied as a follow-up write straight through the
 * low-level query layer, which has no such override. This is what makes
 * `GET /api/posts?sort=publishedAt:desc` reproduce RELEASE_ORDER instead of
 * relying on the incidental order of `create()` timestamps.
 */
async function setReleaseDate(strapi: Core.Strapi, documentId: string, publishedAt: string) {
  await strapi.db.query('api::post.post').update({
    where: { documentId, publishedAt: { $notNull: true } },
    data: { publishedAt },
  });
}

/**
 * Rewrites an existing post from its bundled file when the release lists the
 * fingerprint it has now (`replaces`), and only then. Returns whether it did.
 */
async function replaceIfUnedited(
  strapi: Core.Strapi,
  release: Release,
  article: ParsedArticle,
  documentId: string,
): Promise<boolean> {
  if (!release.replaces?.length) return false;

  const posts = strapi.documents('api::post.post');
  const [draft, published] = await Promise.all([
    posts.findOne({ documentId, status: 'draft', populate: { seo: true } }),
    posts.findOne({ documentId, status: 'published', populate: { seo: true } }),
  ]);
  const content = await postContent(article);
  const target = fingerprint(content);

  // A copy may hold an earlier bundled version (listed in `replaces`) or this
  // one already: a boot that died between update() and publish() leaves the
  // draft at this version, and must not strand the post on the old one.
  const known = (fp: string | null) =>
    fp !== null && (fp === target || (release.replaces?.includes(fp) ?? false));
  const draftPrint = fingerprint(draft);
  const publishedPrint = fingerprint(published);
  if (!known(draftPrint) || !known(publishedPrint)) return false;

  if (draftPrint === target && publishedPrint === target) {
    // Already this version. A boot that died before the date write left the
    // publish time in place of the release date; put it back.
    const at = published?.publishedAt ? new Date(String(published.publishedAt)).getTime() : NaN;
    if (at !== new Date(article.publishedAt).getTime()) {
      await setReleaseDate(strapi, documentId, article.publishedAt);
    }
    return false;
  }

  // This project has no generated content-type typings, so `data` is typed
  // against an empty attribute map; the shape is the one create() writes.
  await posts.update({ documentId, data: content as Parameters<typeof posts.update>[0]['data'] });
  await posts.publish({ documentId });
  await setReleaseDate(strapi, documentId, article.publishedAt);
  return true;
}

/**
 * Publishes the bundled articles as `post` entries, on every
 * boot. Creates a post when no post with that slug exists yet. An existing
 * post is rewritten only when its release lists the fingerprint it still
 * has (`replaces`), so the author can freely edit a published post in Strapi
 * without a deploy reverting it. Never throws: a failure here
 * must not block boot.
 */
export async function publishBundledArticles(strapi: Core.Strapi): Promise<void> {
  let created = 0;
  let replaced = 0;
  let skipped = 0;

  for (const release of RELEASE_ORDER) {
    const { file, publishedAt } = release;
    try {
      const article = parseArticle(file, publishedAt);

      const existing = await strapi.documents('api::post.post').findFirst({
        filters: { slug: article.slug },
      });

      if (existing) {
        if (await replaceIfUnedited(strapi, release, article, existing.documentId)) {
          replaced++;
          strapi.log.info(`[bootstrap/articles] replaced post "${article.slug}"`);
        } else {
          skipped++;
        }
        continue;
      }

      const createdPost = await strapi.documents('api::post.post').create({
        status: 'published',
        data: { ...(await postContent(article)), slug: article.slug },
      });
      await setReleaseDate(strapi, createdPost.documentId, article.publishedAt);

      created++;
      strapi.log.info(`[bootstrap/articles] created post "${article.slug}"`);
    } catch (error) {
      strapi.log.error(
        `[bootstrap/articles] failed to publish ${file}: ${(error as Error).message}`,
      );
    }
  }

  strapi.log.info(
    `[bootstrap/articles] done — created ${created}, replaced ${replaced}, skipped ${skipped}`,
  );
}

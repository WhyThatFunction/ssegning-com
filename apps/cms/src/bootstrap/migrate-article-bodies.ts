import type { Core } from '@strapi/strapi';
import { looksLikeHtml, markdownToHtml } from '../lib/markdown-to-html';

/**
 * One-time boot migration for the `post.body` Markdown -> Tiptap HTML
 * cutover (see `src/api/post/content-types/post/schema.json`, which now
 * declares `body` as the `plugin::tiptap-editor.RichText` custom field
 * instead of `richtext`).
 *
 * `publishBundledArticles` (see `articles.ts`) only ever *creates* posts —
 * it never updates an existing row, specifically so an author's in-Strapi
 * edits survive a pod restart. That means the rows that existed before this
 * cutover shipped would otherwise keep their raw Markdown forever and
 * render as garbage in the Tiptap editor / on the site. This function is
 * the one-off complement: it walks every existing post and converts
 * whichever ones still hold Markdown, once.
 *
 * Written via `strapi.db.query('api::post.post').update(...)`, the same
 * low-level query layer `articles.ts` uses to backdate `publishedAt` —
 * for the same reason: the Document Service's `update()` would create a
 * new draft revision and touch `updatedAt`/publish state, where this
 * migration needs to silently rewrite one field on the existing row(s)
 * without disturbing anything else about them.
 *
 * Idempotent via `looksLikeHtml`: a post already converted (or authored
 * directly as HTML going forward) is left alone, so re-running this on
 * every boot is safe and cheap once the corpus has been converted. Never
 * throws: each post is handled independently, and a single bad row is
 * logged and skipped rather than blocking boot.
 */
export async function migrateArticleBodies(strapi: Core.Strapi): Promise<void> {
  let converted = 0;
  let skipped = 0;

  let posts: Array<{ id: number; documentId: string; body: string | null }>;
  try {
    posts = await strapi.db.query('api::post.post').findMany({
      select: ['id', 'documentId', 'body'],
    });
  } catch (error) {
    strapi.log.error(
      `[bootstrap/migrate-article-bodies] failed to load posts: ${(error as Error).message}`,
    );
    return;
  }

  for (const post of posts) {
    try {
      if (!post.body || looksLikeHtml(post.body)) {
        skipped++;
        continue;
      }

      const html = markdownToHtml(post.body);

      await strapi.db.query('api::post.post').update({
        where: { id: post.id },
        data: { body: html },
      });

      converted++;
      strapi.log.info(`[bootstrap/migrate-article-bodies] converted post ${post.documentId}`);
    } catch (error) {
      strapi.log.error(
        `[bootstrap/migrate-article-bodies] failed to convert post ${post.documentId}: ${(error as Error).message}`,
      );
    }
  }

  strapi.log.info(
    `[bootstrap/migrate-article-bodies] done — converted ${converted}, skipped ${skipped}`,
  );
}

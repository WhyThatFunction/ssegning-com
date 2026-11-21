import {
  htmlToTiptapJson,
  looksLikeHtml,
  looksLikeTiptapJson,
  markdownToTiptapJson,
} from '@ssegning/tiptap-schema';
import type { Core } from '@strapi/strapi';

/**
 * Boot migration that brings every `post.body` to the ONE format the Tiptap
 * custom field can actually load: a serialized Tiptap document.
 *
 * This field is `plugin::tiptap-editor.RichText`, and the plugin's input
 * component reads it as `JSON.parse(value)` and writes it back as
 * `JSON.stringify(editor.getJSON())` — verified in the shipped admin bundle,
 * not inferred. There is no HTML mode: nothing in the plugin ever calls
 * `getHTML()` for storage.
 *
 * So a body has to be converted from whichever of two older shapes it still
 * holds:
 *
 *   - **HTML** — written by the first version of this migration, which
 *     assumed the field stored HTML. Every post ended up here, and every one
 *     of them rendered in the admin as "This component's content is
 *     malformed. Please change it or remove this component.", because
 *     `JSON.parse('<blockquote>…')` throws.
 *   - **Markdown** — the original `richtext` bodies, for any row that
 *     predates all of this.
 *
 * `publishBundledArticles` (see `articles.ts`) only ever *creates* posts, so
 * that an author's edits in Strapi survive a pod restart. Existing rows can
 * therefore only be fixed here.
 *
 * Writes through `strapi.db.query(...)`, the same low-level layer
 * `articles.ts` uses to backdate `publishedAt`: the Document Service's
 * `update()` would open a new draft revision and touch publish state, where
 * this needs to rewrite one column and disturb nothing else.
 *
 * Idempotent via `looksLikeTiptapJson`, so it is safe and cheap on every
 * boot once the corpus is converted. Never throws: each post is handled on
 * its own, and one bad row is logged and skipped rather than blocking boot.
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
      if (!post.body || looksLikeTiptapJson(post.body)) {
        skipped++;
        continue;
      }

      const body = looksLikeHtml(post.body)
        ? htmlToTiptapJson(post.body)
        : await markdownToTiptapJson(post.body);

      await strapi.db.query('api::post.post').update({
        where: { id: post.id },
        data: { body },
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

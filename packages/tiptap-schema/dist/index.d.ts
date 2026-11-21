/**
 * The ONE Tiptap document schema for this project.
 *
 * Three places have to agree on it or content silently loses nodes:
 *   1. the Strapi admin editor (`@notum-cz/strapi-plugin-tiptap-editor`,
 *      configured by the `article` preset in `apps/cms/config/plugins.ts`),
 *   2. the CMS, which converts bundled Markdown articles into the stored
 *      document, and
 *   3. the website, which turns that stored document back into HTML.
 *
 * (2) and (3) both import this list, which is the whole reason this package
 * exists — the list must never be copy-pasted into either app.
 *
 * WHAT IS DELIBERATELY ABSENT: `Link` and `Underline`. StarterKit v3 already
 * provides both (verified by listing the kit's own extensions: blockquote,
 * bold, bulletList, code, codeBlock, doc, dropCursor, gapCursor, hardBreak,
 * heading, horizontalRule, italic, link, listItem, listKeymap, orderedList,
 * paragraph, strike, text, trailingNode, underline, undoRedo). Adding them
 * again produces tiptap's "Duplicate extension names found" warning — which
 * the live admin already logs, because the plugin's preset re-adds
 * `underline` on top of its own StarterKit.
 *
 * Tables come from `TableKit`, the bundle that carries table/tableRow/
 * tableHeader/tableCell together; registering those four individually
 * duplicates them for the same reason.
 *
 * Heading levels stop at 4 to match the `article` preset: the post's own
 * `title` field is the H1, and the articles only use `##`/`###`.
 */
export declare const articleExtensions: (import("@tiptap/core").Extension<import("@tiptap/starter-kit").StarterKitOptions, any> | import("@tiptap/core").Extension<import("@tiptap/extension-table").TableKitOptions, any> | import("@tiptap/core").Node<import("@tiptap/extension-image").ImageOptions, any>)[];
/** Serialized Tiptap document, exactly as `post.body` stores it. */
export type TiptapJson = string;
/**
 * True when `body` already holds a serialized Tiptap document.
 *
 * The plugin stores `JSON.stringify(editor.getJSON())`, i.e. an object
 * literal, so a leading `{` is the discriminator. Markdown and the HTML the
 * pre-fix migration wrote both start with something else — prose, `>`, or a
 * block-level tag — so this cannot false-positive against either.
 */
export declare function looksLikeTiptapJson(body: string): boolean;
/** True when `body` is HTML rather than Markdown. */
export declare function looksLikeHtml(body: string): boolean;
/** Parses HTML into a serialized Tiptap document. */
export declare function htmlToTiptapJson(html: string): TiptapJson;
/**
 * Converts a bundled article's Markdown into a serialized Tiptap document.
 *
 * Async only because `marked` is ESM-only with no `require` condition. Node
 * 22.12+ can `require()` an ES module, but relying on that would make this
 * package's usability a property of the runtime's minor version; a dynamic
 * import works everywhere and both callers (the article seeder and the boot
 * migration) are already async.
 */
export declare function markdownToTiptapJson(markdown: string): Promise<TiptapJson>;
/**
 * Renders a stored Tiptap document back to HTML, for the website.
 *
 * Accepts the serialized string the field holds, or an already-parsed
 * document.
 */
export declare function tiptapJsonToHtml(body: TiptapJson | object): string;

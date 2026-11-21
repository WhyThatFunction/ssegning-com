"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleExtensions = void 0;
exports.looksLikeTiptapJson = looksLikeTiptapJson;
exports.looksLikeHtml = looksLikeHtml;
exports.htmlToTiptapJson = htmlToTiptapJson;
exports.markdownToTiptapJson = markdownToTiptapJson;
exports.tiptapJsonToHtml = tiptapJsonToHtml;
const extension_image_1 = require("@tiptap/extension-image");
const extension_table_1 = require("@tiptap/extension-table");
const server_1 = require("@tiptap/html/server");
const starter_kit_1 = require("@tiptap/starter-kit");
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
exports.articleExtensions = [
    starter_kit_1.StarterKit.configure({
        heading: { levels: [2, 3, 4] },
    }),
    extension_table_1.TableKit,
    extension_image_1.Image,
];
/**
 * Matches a fenced code block's opening line carrying an info string, e.g.
 * ```` ```mermaid ````. Capture group 1 is the declared language.
 */
const FENCED_BLOCK_LANGUAGE_PATTERN = /^ {0,3}```+([a-zA-Z0-9_-]+)\s*$/gm;
/**
 * Guards the contract the whole diagram pipeline rests on: a fenced block
 * that declared a language must come out of `marked` as
 * `<pre><code class="language-<lang>">`. Tiptap's CodeBlock parses that exact
 * class into its `language` attribute and re-emits it on every save, and the
 * website matches it to swap the block for a rendered Mermaid diagram.
 *
 * Checked per distinct language actually used, so one broken block among
 * several correct ones still fails loudly rather than shipping a diagram
 * that renders as a code listing.
 */
function assertLanguageClassContractHolds(markdown, html) {
    const declaredLanguages = new Set(Array.from(markdown.matchAll(FENCED_BLOCK_LANGUAGE_PATTERN), (match) => match[1]));
    for (const language of declaredLanguages) {
        const expectedClass = `<pre><code class="language-${language}">`;
        if (!html.includes(expectedClass)) {
            throw new Error(`[tiptap-schema] expected \`marked\` to emit ${JSON.stringify(expectedClass)} for a ` +
                `\`\`\`${language} fenced block, but it did not — the CodeBlock <-> Mermaid-detection ` +
                "contract would break silently. Check the installed `marked` version's default renderer.");
        }
    }
}
/**
 * Rejects HTML carrying a literal `-->`.
 *
 * This is not stylistic. `generateJSON` parses with a server DOM that
 * mis-handles a bare comment-close inside text, and the failure mode is
 * silent CONTENT CORRUPTION rather than an error: feeding it
 * `<pre><code>flowchart TD\n    A --> B</code></pre>` yields the text
 * `flowchart TD\n    A flowchart TD\n    A --> B` — the content before the
 * arrow duplicated. Every Mermaid flowchart in this project uses `-->`.
 *
 * Nothing in the real pipeline produces this, which is exactly why it needs a
 * guard rather than a fix: `marked` escapes `>` to `&gt;` inside code blocks,
 * and all 173 arrows across the live corpus are escaped. So this throws only
 * when HTML arrives from somewhere that did not escape it, and it throws
 * instead of quietly mangling a diagram.
 */
function assertNoRawCommentClose(html) {
    if (html.includes('-->')) {
        throw new Error('[tiptap-schema] refusing to parse HTML containing a literal `-->`: the server DOM ' +
            'duplicates the surrounding text instead of failing, which silently corrupts Mermaid ' +
            'diagrams. Escape it as `--&gt;` (which is what `marked` already does inside code blocks).');
    }
}
/**
 * True when `body` already holds a serialized Tiptap document.
 *
 * The plugin stores `JSON.stringify(editor.getJSON())`, i.e. an object
 * literal, so a leading `{` is the discriminator. Markdown and the HTML the
 * pre-fix migration wrote both start with something else — prose, `>`, or a
 * block-level tag — so this cannot false-positive against either.
 */
function looksLikeTiptapJson(body) {
    return body.trimStart().startsWith('{');
}
// Block-level tags that can legitimately open an HTML document fragment.
const HTML_BLOCK_TAG_PATTERN = /^<(p|h[1-6]|pre|ul|ol|blockquote|table|hr|figure|div)[\s>/]/i;
/** True when `body` is HTML rather than Markdown. */
function looksLikeHtml(body) {
    return HTML_BLOCK_TAG_PATTERN.test(body.trimStart());
}
/** Parses HTML into a serialized Tiptap document. */
function htmlToTiptapJson(html) {
    assertNoRawCommentClose(html);
    return JSON.stringify((0, server_1.generateJSON)(html, exports.articleExtensions));
}
/**
 * Converts a bundled article's Markdown into a serialized Tiptap document.
 *
 * Async only because `marked` is ESM-only with no `require` condition. Node
 * 22.12+ can `require()` an ES module, but relying on that would make this
 * package's usability a property of the runtime's minor version; a dynamic
 * import works everywhere and both callers (the article seeder and the boot
 * migration) are already async.
 */
async function markdownToTiptapJson(markdown) {
    const { marked } = await import('marked');
    const html = marked.parse(markdown, { async: false });
    assertLanguageClassContractHolds(markdown, html);
    return htmlToTiptapJson(html);
}
/**
 * Renders a stored Tiptap document back to HTML, for the website.
 *
 * Accepts the serialized string the field holds, or an already-parsed
 * document.
 */
function tiptapJsonToHtml(body) {
    const document = typeof body === 'string' ? JSON.parse(body) : body;
    return (0, server_1.generateHTML)(document, exports.articleExtensions);
}

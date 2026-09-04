import { marked } from 'marked';

/**
 * Converts a bundled article's Markdown body to the HTML the Tiptap custom
 * field (`plugin::tiptap-editor.RichText`, see `post.body` in
 * `src/api/post/content-types/post/schema.json`) expects to load.
 *
 * GFM is on by default in `marked` (tables, autolinks, strikethrough, etc.),
 * which is exactly what the article corpus under `src/bootstrap/articles/`
 * uses (8 GFM tables across 6 files) — no extra config needed there.
 *
 * The one thing that MUST hold, and is asserted below rather than just
 * assumed, is fenced-code-block markup: the website's article renderer
 * detects a Mermaid diagram by matching `<pre><code class="language-XXX">`
 * verbatim, and Tiptap's `CodeBlock` node (configured with
 * `languageClassPrefix: "language-"`, see `config/plugins.ts`) both parses
 * that exact class *and* re-emits it unchanged on every save — so this
 * function's output is the one place in the whole pipeline responsible for
 * producing it in the first place. `marked`'s default renderer already
 * emits `class="language-<lang>"` for a fenced block with an info string
 * (verified: `marked.parse('```mermaid\\n...\\n```')` ->
 * `<pre><code class="language-mermaid">...`), so no renderer override is
 * required — but `assertMermaidContractHolds` below fails loudly at runtime
 * if a future `marked` upgrade ever changes that default, instead of
 * silently shipping broken diagrams.
 *
 * Deliberately NOT enabled: any raw-HTML passthrough beyond `marked`'s
 * default (which already passes inline/block HTML through verbatim). The
 * article corpus has zero embedded HTML, so there is nothing to opt into.
 */
// Matches a fenced code block's opening line with an info string, e.g.
// "```mermaid". Capture group 1 is the declared language.
const FENCED_BLOCK_LANGUAGE_PATTERN = /^ {0,3}```+([a-zA-Z0-9_-]+)\s*$/gm;

export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false });

  assertMermaidContractHolds(markdown, html);

  return html;
}

/**
 * Guards the load-bearing assumption documented above: every fenced code
 * block in the source that declared a language must appear in the output as
 * `<pre><code class="language-<lang>">` — checked per distinct language
 * actually used (not just "some language survived somewhere"), so one
 * broken block among several correct ones still fails loudly. Throws
 * rather than silently shipping broken markup if a `marked` version change
 * ever stops doing this — the caller (bootstrap, migration) already catches
 * per-article and logs, so this fails one article loudly instead of
 * corrupting it quietly.
 */
function assertMermaidContractHolds(markdown: string, html: string): void {
  const declaredLanguages = new Set(
    Array.from(markdown.matchAll(FENCED_BLOCK_LANGUAGE_PATTERN), (m) => m[1]),
  );

  for (const lang of declaredLanguages) {
    const expectedClass = `<pre><code class="language-${lang}">`;
    if (!html.includes(expectedClass)) {
      throw new Error(
        `[lib/markdown-to-html] expected \`marked\` to emit ${JSON.stringify(expectedClass)}` +
          ` for a \`\`\`${lang} fenced block, but it did not — the Tiptap CodeBlock <-> ` +
          'Mermaid-detection contract would break silently. Check the installed `marked` ' +
          "version's default renderer.",
      );
    }
  }
}

// Block-level tags that can legitimately open an HTML document fragment.
// Kept in sync with the discriminator comment on `looksLikeHtml` below.
const HTML_BLOCK_TAG_PATTERN = /^<(p|h[1-6]|pre|ul|ol|blockquote|table|hr|figure|div)[\s>/]/i;

/**
 * True when `body` is already HTML rather than Markdown.
 *
 * This is a safe discriminator ONLY because of two facts verified against
 * the actual corpus (see the task's research notes, not re-derived here):
 * the bundled Markdown articles contain zero embedded raw HTML, and every
 * one of them starts with either a `>` blockquote (the belief/reality
 * intro) or plain prose — never a bare block-level tag. So "starts with a
 * block tag" cannot false-positive against real Markdown input, and
 * `markdownToHtml`'s own output always starts with a block tag (`<p>`,
 * `<h2>`, `<blockquote>`, ...). That makes this the idempotency guard for
 * the boot migration in `bootstrap/migrate-article-bodies.ts`: a post whose
 * body already looks like HTML is left alone on every subsequent boot.
 */
export function looksLikeHtml(body: string): boolean {
  return HTML_BLOCK_TAG_PATTERN.test(body.trimStart());
}

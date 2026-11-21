import parse, { type Element, type HTMLReactParserOptions } from 'html-react-parser';
import sanitizeHtml from 'sanitize-html';

import { MermaidDiagram } from './mermaid-diagram';

// `sanitize-html`'s types ship as `export = sanitize` with `IOptions` nested
// under that namespace, which doesn't play well with a plain named import
// under this project's module settings — deriving the options type from the
// function's own signature sidesteps that instead of fighting the typings.
type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

/**
 * Renders `post.body`, which is now Tiptap-authored HTML (see
 * `apps/cms/src/lib/markdown-to-html.ts` and the `plugin::tiptap-editor`
 * field on `api::post.post`) rather than Strapi's Markdown `richtext`.
 *
 * `<Markdown>` (`markdown.tsx`) needs no sanitizer: `react-markdown` parses
 * Markdown into an AST and builds a React element tree from it, so there is
 * no code path where CMS-authored text becomes raw markup the browser
 * executes. HTML has no such structural guarantee — a `<script>` tag, an
 * `onerror` attribute, or a `javascript:` URL in the source string would
 * otherwise render (or run) as-is. Tiptap's own toolbar makes some of that
 * reachable in practice, not just in theory: its link mark lets an editor
 * type an arbitrary `href` (including `javascript:...`), so sanitization
 * here isn't defense against a hypothetical attacker — it's a guardrail on
 * the CMS's own editing surface.
 *
 * Pipeline, in order, and why the order matters:
 *   1. **Sanitize the raw HTML string first**, with `sanitize-html` (pure
 *      string in, string out — no DOM required, so this runs fine in a
 *      React Server Component). This strips anything outside the allowlist
 *      below *before* any parser gets a chance to turn it into elements.
 *      Parsing untrusted HTML first and sanitizing the resulting tree
 *      second would mean trusting the parser to safely handle arbitrary
 *      input in the first place — sanitizing the string is the step that
 *      actually removes the danger.
 *   2. **Parse the sanitized string** with `html-react-parser`, which walks
 *      the (now-safe) HTML and produces React elements.
 *   3. **Intercept mermaid blocks** via `html-react-parser`'s `replace`
 *      option: a `<pre><code class="language-mermaid">` — the exact markup
 *      Tiptap's `CodeBlock` node parses and re-emits — is swapped for a
 *      real `<MermaidDiagram>` instead of a code block. This is the same
 *      contract `<Markdown>` relies on, just intercepted after HTML parsing
 *      instead of after Markdown parsing.
 */

// Every element the Tiptap `article` preset (and the article corpus) can
// produce. Deliberately does NOT include `div`, `iframe`, `script`, `style`,
// or any attribute-driven event handler — those are the exact things a
// sanitizer for CMS HTML exists to keep out.
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'hr',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
  'span',
];

const SANITIZE_OPTIONS: SanitizeOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    // `class` is the ONLY attribute allowed on `code` — and it's load-bearing,
    // not decorative: `<pre><code class="language-mermaid">` is the exact
    // markup Tiptap's CodeBlock node round-trips and the only signal this
    // component (and the CMS) uses to detect a diagram (see the `replace`
    // callback below). Dropping `class` here would silently turn every
    // mermaid diagram in the corpus back into a plain code block. Nothing
    // else needs filtering via `allowedClasses` — sanitize-html passes a
    // tag's `class` value through unfiltered once it's in `allowedAttributes`
    // for that tag, unless `allowedClasses` narrows it further, which we
    // don't need here since `code` never carries any other class.
    code: ['class'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  // Restricts every URL-bearing attribute (`href`, `src`, ...) to these
  // schemes. This is what stops a `javascript:alert(1)` link — Tiptap's
  // link mark lets an editor type any `href`, so this isn't a theoretical
  // guard. `mailto` is kept because the contact/about copy elsewhere on the
  // site links `mailto:` addresses; `data:` is deliberately excluded even
  // for `img src`, since the corpus has no images and there's no reason to
  // allow an inline-encoded payload in one.
  allowedSchemes: ['http', 'https', 'mailto'],
  // Any link an editor marks to open in a new tab gets a hardened `rel`
  // whether or not they set one themselves — `target="_blank"` without
  // `rel="noopener"` lets the opened page reach back into this one via
  // `window.opener`. Only fires for `target="_blank"`; a same-tab link is
  // left alone. `rel` still has to be listed in `allowedAttributes.a` above,
  // or the allowlist filter that runs after this transform would strip it
  // right back off.
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        attribs.rel = 'noopener noreferrer';
      }
      return { tagName, attribs };
    },
  },
};

// `Element['children']` is `domhandler`'s `ChildNode[]` — a wider union than
// the `DOMNode` the `replace` callback below receives (it additionally
// covers `CDATA`/`Document`, which can only ever appear as a *child*, never
// as the node `replace` is called with). Typing the recursive helpers below
// against this wider union, rather than `DOMNode`, is what lets the same
// functions walk both a top-level `replace` node and its `.children`.
type AnyChildNode = Element['children'][number];

/** Recursively concatenates the text content of a parsed DOM node. */
function textContent(node: AnyChildNode): string {
  if (node.type === 'text') return node.data;
  if ('children' in node) {
    return node.children.map(textContent).join('');
  }
  return '';
}

function isElement(node: AnyChildNode): node is Element {
  return node.type === 'tag';
}

function isMermaidCodeBlock(node: AnyChildNode): boolean {
  if (!isElement(node) || node.name !== 'code') return false;
  return /(?:^|\s)language-mermaid(?:\s|$)/.test(node.attribs.class ?? '');
}

const PARSE_OPTIONS: HTMLReactParserOptions = {
  replace(domNode) {
    if (!isElement(domNode) || domNode.name !== 'pre') return undefined;

    // Only element children matter for this check — a stray whitespace text
    // node between `<pre>` and `<code>` (not present in `marked`'s output,
    // but not guaranteed by the type either) must not defeat detection.
    const codeChild = domNode.children.find((child) => child.type === 'tag');
    if (!codeChild || !isMermaidCodeBlock(codeChild)) return undefined;

    // `html-react-parser` sits on `html-dom-parser`/`htmlparser2`, which — like
    // any real HTML parser — decodes character references while building the
    // DOM: a text node's `.data` is already `-->`, not `--&gt;`, even though
    // `marked` (and then `sanitize-html`'s own re-serialization) wrote the
    // entity-escaped form into the HTML string. That decoding is exactly what
    // mermaid needs: it parses diagram syntax, not HTML, so a literal
    // `--&gt;` would fail to parse as an arrow. The trap this comment exists
    // to name: pulling the chart text out with a regex over the raw HTML
    // string instead of via the parser (e.g. to "keep it simple") would skip
    // that decoding step entirely and hand mermaid still-escaped text.
    return <MermaidDiagram chart={textContent(codeChild).replace(/\n$/, '')} />;
  },
};

export function RichHtml({ children }: { children: string }) {
  const sanitized = sanitizeHtml(children, SANITIZE_OPTIONS);

  return <div className="prose">{parse(sanitized, PARSE_OPTIONS)}</div>;
}

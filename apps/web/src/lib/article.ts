import 'server-only';

import { looksLikeTiptapJson, tiptapJsonToHtml } from '@ssegning/tiptap-schema';

/** A section of an article, as linked from its "On this page" rail. */
export interface ArticleHeading {
  id: string;
  text: string;
}

export interface PreparedArticle {
  /** The article body as HTML, with an `id` on every `<h2>`. Not yet sanitized. */
  html: string;
  /** Every `<h2>`, in document order, with the same ids as `html`. */
  headings: ArticleHeading[];
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Decodes the handful of entities a serializer emits in heading text. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const value =
        code[1] === 'x' || code[1] === 'X'
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : whole;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? whole;
  });
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

/** Element ids the article page renders outside the body. */
const RESERVED_IDS = ['main-content', 'mobile-nav-panel', 'more-from-the-journal'];

/**
 * Turns a stored post body into renderable HTML, and gives every `<h2>` an id
 * so the article can link to its own sections.
 *
 * The ids are written into the HTML here, in the same pass that collects the
 * headings, rather than being worked out separately by the renderer and the
 * rail. Two places deriving ids independently would agree until the day one
 * of them handled a duplicate title differently -- and then every link in the
 * rail would point somewhere wrong without failing.
 *
 * Duplicate titles get `-2`, `-3` and so on, in document order.
 */
export function prepareArticle(body: string): PreparedArticle {
  // The field stores a serialized Tiptap document. A body that is not one is
  // HTML left from before the CMS's boot migration converted it: web and cms
  // are separate Deployments, so for a short window after a deploy this app
  // can be new while the rows are still old. Rendering that HTML keeps the
  // article readable through the window. Nothing writes HTML to the field any
  // more, so once the migration has run this branch is unreachable.
  const source = looksLikeTiptapJson(body) ? tiptapJsonToHtml(body) : body;

  const headings: ArticleHeading[] = [];
  // Seeded with ids the page itself already uses (layout, header, related
  // posts), so a section titled "Main content" becomes `main-content-2`
  // instead of a second element with the skip link's target id.
  const seen = new Map<string, number>(RESERVED_IDS.map((id) => [id, 1]));

  const html = source.replace(/<h2(?:\s[^>]*)?>([\s\S]*?)<\/h2>/g, (_whole, inner: string) => {
    const text = decodeEntities(inner.replace(/<[^>]+>/g, '')).trim();
    const base = slugify(text);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;

    headings.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  return { html, headings };
}

import type { ArticleHeading } from '@/lib/article';

/**
 * The "On this page" rail: an article's sections as anchor links, sticky
 * beside the text so a reader can see where they are in a long piece and jump.
 *
 * Plain links, server-rendered, no script -- it works before hydration and
 * with JavaScript off. Pattern from documentation sites such as Factory's,
 * whose slim right-hand quick-nav column does exactly this job.
 *
 * Renders nothing for an article with fewer than two sections: a one-item
 * table of contents is noise.
 */
export function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="sticky top-10">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
        On this page
      </p>
      <ol className="mt-4 flex flex-col gap-1 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="-ml-px block border-l border-transparent py-1 pl-4 text-sm leading-snug text-ink-muted transition-colors duration-150 ease-out hover:border-accent hover:text-ink"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

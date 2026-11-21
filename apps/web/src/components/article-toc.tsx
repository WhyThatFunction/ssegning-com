'use client';

import { useEffect, useState } from 'react';

import type { ArticleHeading } from '@/lib/article';

/**
 * Where a heading has to be, measured from the top of the viewport, to count
 * as the section being read. Matches the h2 `scroll-margin-top` (2.5rem) plus
 * a little slack, so following a link to a section highlights that section.
 */
const READING_LINE_PX = 96;

/**
 * Picks the section being read: the last heading that has scrolled above the
 * reading line. At the very bottom of the page the last heading wins even if
 * it never reached the line -- a short final section otherwise never lights up.
 * Above the first heading nothing is highlighted.
 */
function currentHeading(ids: string[]): string | null {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atBottom) return ids.at(-1) ?? null;

  let current: string | null = null;
  for (const id of ids) {
    const element = document.getElementById(id);
    if (!element) continue;
    if (element.getBoundingClientRect().top > READING_LINE_PX) break;
    current = id;
  }
  return current;
}

/**
 * The "On this page" rail: an article's sections as anchor links, sticky
 * beside the text so a reader can see where they are in a long piece and jump.
 *
 * The links are rendered on the server and work without JavaScript. Once
 * hydrated, the rail also marks the section in view (`aria-current`), read
 * from scroll position on each animation frame rather than an
 * IntersectionObserver: an observer reports elements crossing a band, which
 * says nothing while a long section with no heading in view is on screen.
 *
 * Renders nothing for an article with fewer than two sections: a one-item
 * table of contents is noise.
 */
export function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const ids = headings.map((heading) => heading.id);
    let frame = 0;
    const update = () => {
      frame = 0;
      setActiveId(currentHeading(ids));
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="sticky top-10">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
        On this page
      </p>
      <ol className="mt-4 flex flex-col gap-1 border-l border-border">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? 'location' : undefined}
                className={`-ml-px block border-l py-1 pl-4 text-sm leading-snug transition-colors duration-150 ease-out hover:border-accent hover:text-ink ${
                  active ? 'border-accent text-ink' : 'border-transparent text-ink-muted'
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

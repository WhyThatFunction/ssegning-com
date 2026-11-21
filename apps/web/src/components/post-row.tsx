import Link from 'next/link';

import type { Post } from '@/lib/types';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * One line of the journal's index: title, reading time, date.
 *
 * A table-like row rather than a card -- the layout of Linear's blog index,
 * where every entry below the featured one is a ruled row with aligned
 * columns. It suits this journal especially well: the posts have no cover
 * images, so a grid of cards would be a grid of empty boxes, and aligned
 * dates make the list scannable as a sequence.
 *
 * Below `sm` the metadata drops under the title instead of squeezing beside it.
 */
export function PostRow({ post }: { post: Post }) {
  const date = formatDate(post.publishedAt);

  return (
    <Link
      href={`/journal/${post.slug}`}
      className="group -mx-4 grid grid-cols-1 gap-1 rounded-input border-b border-border px-4 py-4 transition-colors duration-150 ease-out last:border-b-0 hover:bg-surface-1 sm:grid-cols-[minmax(0,1fr)_auto_7rem] sm:items-baseline sm:gap-8"
    >
      <span className="text-base text-ink text-balance group-hover:text-accent">{post.title}</span>
      <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted tabular-nums">
        {post.readingMinutes ? `${post.readingMinutes} min` : ''}
      </span>
      {date ? (
        <time
          dateTime={post.publishedAt ?? undefined}
          className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted tabular-nums sm:text-right"
        >
          {date}
        </time>
      ) : null}
    </Link>
  );
}

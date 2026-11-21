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
 * "More from the journal": a row of other articles at the end of one, so a
 * reader who finished has somewhere to go besides the back button.
 *
 * These are the newest other posts, not "related" ones -- posts carry no tags
 * or categories to relate them by, and the label says what the list actually
 * is rather than implying a recommendation the data cannot make.
 */
export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="more-from-the-journal" className="mt-20 border-t border-border pt-10">
      <h2
        id="more-from-the-journal"
        className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
      >
        More from the journal
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {posts.map((post) => {
          const date = formatDate(post.publishedAt);
          return (
            <Link
              key={post.documentId}
              href={`/journal/${post.slug}`}
              className="group flex flex-col gap-3 rounded-card bg-surface-1 p-5 transition-colors duration-150 ease-out hover:bg-surface-2"
            >
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-muted">
                {date}
                {post.readingMinutes ? ` · ${post.readingMinutes} min` : ''}
              </span>
              <span className="text-base font-medium leading-snug text-ink text-balance group-hover:text-accent">
                {post.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

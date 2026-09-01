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

export function PostCard({ post }: { post: Post }) {
  const date = formatDate(post.publishedAt);

  return (
    <Link
      href={`/journal/${post.slug}`}
      className="group block border-b border-border py-6 transition-colors duration-150 ease-out first:pt-0 last:border-b-0"
    >
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
        {date ? <time dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
        {post.readingMinutes ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </>
        ) : null}
      </div>
      <h3 className="mt-2 text-heading font-medium text-ink group-hover:text-accent">
        {post.title}
      </h3>
      {post.excerpt ? <p className="mt-2 text-sm text-ink-muted">{post.excerpt}</p> : null}
    </Link>
  );
}

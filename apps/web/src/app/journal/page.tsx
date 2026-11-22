import type { Metadata } from 'next';
import Link from 'next/link';

import { PostRow } from '@/components/post-row';
import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';
import { StatusLine } from '@/components/status-line';
import { getPosts } from '@/lib/strapi';
import type { Post } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Notes on Kubernetes, Rust, TypeScript, and running production infrastructure.',
};

// ISR: regenerate at most once a minute. A regeneration that throws (the CMS
// did not answer, see CmsUnavailableError) keeps the last good copy.
export const revalidate = 60;

export default async function JournalPage() {
  const posts = await getPosts();
  const list = posts;
  const [featured, ...rest] = list;

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <SectionHeading
        eyebrow="Journal"
        title="Notes from the field"
        description="Short write-ups on the decisions and trade-offs behind the systems I build."
      />
      {featured ? (
        <>
          <FeaturedPost post={featured} />

          {rest.length > 0 ? (
            <div className="mt-14">
              <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                All writing
              </h2>
              <div className="mt-3">
                {rest.map((post) => (
                  <PostRow key={post.documentId} post={post} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-10">
          <StatusLine>Nothing published yet — the first post is on its way.</StatusLine>
        </div>
      )}
    </Section>
  );
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * The newest article, given the page's one hero surface (the 28px radius,
 * one tint level up). Linear's blog index opens the same way: featured work
 * first, then a dense list. Text only, because posts carry no cover image --
 * an empty image slot here would be a placeholder pretending to be a picture.
 */
function FeaturedPost({ post }: { post: Post }) {
  const date = formatDate(post.publishedAt);

  return (
    <Link
      href={`/journal/${post.slug}`}
      className="group mt-10 flex flex-col gap-4 rounded-hero bg-surface-2 p-8 transition-colors duration-150 ease-out hover:bg-surface-3 sm:p-12"
    >
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-accent">
        Latest
      </span>
      <span className="max-w-3xl text-heading-lg font-light tracking-tight text-balance text-ink">
        {post.title}
      </span>
      {post.excerpt ? <span className="max-w-2xl text-ink-muted">{post.excerpt}</span> : null}
      <span className="mt-2 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
        {date ? <time dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
        {post.readingMinutes ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </>
        ) : null}
      </span>
    </Link>
  );
}

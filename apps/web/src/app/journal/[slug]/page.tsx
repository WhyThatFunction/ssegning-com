import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Comments } from '@/components/comments';
import { Container } from '@/components/container';
import { RichHtml } from '@/components/rich-html';
import { Section } from '@/components/section';
import { posts as fallbackPosts } from '@/content/fallback';
import { mediaAlt, resolveMediaUrl } from '@/lib/media';
import { getPostBySlug, getPosts } from '@/lib/strapi';
import type { Post } from '@/lib/types';

/**
 * Resolves the article for a slug, or `null` to 404.
 *
 * The distinction that matters is between the CMS saying "no such article" and
 * the CMS not answering. Only the second is a reason to show hand-written
 * copy: the URL may be perfectly good and the site is merely degraded. The
 * first means the URL is wrong, and answering it with a article the CMS has
 * never heard of is how /journal/why-i-run-talos-linux and
 * /journal/picking-rust-or-typescript-honestly came to return 200 — two
 * articles live and indexable that exist nowhere in the CMS.
 */
async function resolvePost(slug: string): Promise<Post | null> {
  const lookup = await getPostBySlug(slug);

  if (lookup.status === 'found') return lookup.value;
  if (lookup.status === 'missing') return null;

  return fallbackPosts.find((item) => item.slug === slug) ?? null;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;
// Explicit so a slug missing from generateStaticParams (Strapi unreachable at build time) still renders on demand instead of 404ing.
export const dynamicParams = true;

export async function generateStaticParams() {
  // Real records only. Prerendering the fallback slugs would bake a 200 page
  // for a article the CMS does not have — and because the build runs in CI with
  // no Strapi reachable, that is exactly the list this would otherwise return.
  // `dynamicParams` is true (below), so anything not listed here still renders
  // on demand; an unknown slug reaches `resolvePost` and 404s there.
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await resolvePost(slug);
  if (!post) return {};

  const description = post.seo?.metaDescription ?? post.excerpt ?? undefined;

  return {
    title: post.seo?.metaTitle ?? post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      images: [{ url: `/journal/${slug}/banner`, width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await resolvePost(slug);
  if (!post) notFound();

  const coverUrl = resolveMediaUrl(post.cover);
  const date = formatDate(post.publishedAt);

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <Container>
        <Link href="/journal" className="text-sm text-ink-muted hover:text-ink">
          ← All posts
        </Link>

        <div className="mt-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
          {date ? <time dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
          {post.readingMinutes ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
            </>
          ) : null}
        </div>

        <h1 className="mt-3 text-display font-medium tracking-tight text-balance text-ink">
          {post.title}
        </h1>

        {/* An uploaded cover wins; otherwise the generated banner (see
            lib/article-banner.tsx), so every article has one from the moment
            it exists. `unoptimized` because the source is already a
            server-rendered PNG at exactly this size — putting it through the
            image optimizer would re-encode it for nothing. */}
        <div className="relative mt-8 aspect-[1200/630] overflow-hidden rounded-card border border-border">
          <Image
            src={coverUrl ?? `/journal/${slug}/banner`}
            alt={coverUrl ? mediaAlt(post.cover, post.title) : post.title}
            fill
            sizes="100vw"
            priority
            unoptimized={!coverUrl}
            className="object-cover"
          />
        </div>

        {post.body ? (
          <div className="mt-10">
            <RichHtml>{post.body}</RichHtml>
          </div>
        ) : null}

        <Comments
          repo={process.env.GISCUS_REPO}
          repoId={process.env.GISCUS_REPO_ID}
          category={process.env.GISCUS_CATEGORY}
          categoryId={process.env.GISCUS_CATEGORY_ID}
        />
      </Container>
    </Section>
  );
}

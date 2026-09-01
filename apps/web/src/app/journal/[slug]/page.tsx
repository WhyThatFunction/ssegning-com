import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Comments } from '@/components/comments';
import { Container } from '@/components/container';
import { Markdown } from '@/components/markdown';
import { Section } from '@/components/section';
import { posts as fallbackPosts } from '@/content/fallback';
import { mediaAlt, resolveMediaUrl } from '@/lib/media';
import { getPostBySlug, getPosts } from '@/lib/strapi';
import type { Post } from '@/lib/types';

async function resolvePost(slug: string): Promise<Post | null> {
  const post = await getPostBySlug(slug);
  if (post) return post;
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
  const posts = await getPosts();
  const list = posts.length > 0 ? posts : fallbackPosts;
  return list.map((post) => ({ slug: post.slug }));
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
    openGraph: { title: post.title, description, type: 'article' },
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

        {coverUrl ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-card border border-border">
            <Image
              src={coverUrl}
              alt={mediaAlt(post.cover, post.title)}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>
        ) : null}

        {post.body ? (
          <div className="mt-10">
            <Markdown>{post.body}</Markdown>
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

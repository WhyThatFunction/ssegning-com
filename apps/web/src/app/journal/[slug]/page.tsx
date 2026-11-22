import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArticleToc } from '@/components/article-toc';
import { Comments } from '@/components/comments';
import { Container } from '@/components/container';
import { RelatedPosts } from '@/components/related-posts';
import { RichHtml } from '@/components/rich-html';
import { Section } from '@/components/section';
import { prepareArticle } from '@/lib/article';
import { mediaAlt, resolveMediaUrl } from '@/lib/media';
import { CmsUnavailableError, getPostBySlug, getPosts } from '@/lib/strapi';
import type { Post } from '@/lib/types';

/**
 * Resolves the article for a slug, or `null` to 404.
 *
 * Three answers, three outcomes. The CMS has it: render it. The CMS answered
 * and has no such article: the URL is wrong, so 404. The CMS did not answer:
 * the URL may be perfectly good, so this is never a 404 -- it throws
 * `CmsUnavailableError`, and Next keeps serving the last good copy of the page
 * (see the class in lib/strapi.ts). There is no hand-written fallback here:
 * a fallback answered at a real URL is cached and indexed like the real page.
 *
 * Answering an article the CMS has never heard of is how
 * /journal/why-i-run-talos-linux and /journal/picking-rust-or-typescript-honestly
 * came to return 200 -- two articles live and indexable that exist nowhere in
 * the CMS -- so `missing` never falls back.
 */
async function resolvePost(slug: string): Promise<Post | null> {
  const lookup = await getPostBySlug(slug);

  if (lookup.status === 'found') return lookup.value;
  if (lookup.status === 'missing') return null;

  throw new CmsUnavailableError(`article "${slug}"`);
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ISR: regenerate at most once a minute. A regeneration that throws (the CMS
// did not answer, see CmsUnavailableError) keeps the last good copy.
export const revalidate = 60;
// Explicit so a slug published after the build still renders on demand instead of 404ing.
export const dynamicParams = true;

export async function generateStaticParams() {
  // Prerenders every article the CMS lists. If the list cannot be fetched the
  // build fails (CmsUnavailableError) rather than shipping an image with none.
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
    // No `images` here: ./opengraph-image.tsx supplies the card through Next's
    // own convention, and setting both would list the image twice.
    openGraph: { title: post.title, description, type: 'article' },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await resolvePost(slug);
  if (!post) notFound();

  const coverUrl = resolveMediaUrl(post.cover);
  const date = formatDate(post.publishedAt);
  const article = post.body ? prepareArticle(post.body) : null;
  const morePosts = (await getPosts()).filter((item) => item.slug !== post.slug).slice(0, 3);

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

        <h1 className="mt-3 text-display font-light tracking-tight text-balance text-ink">
          {post.title}
        </h1>

        {/* The cover is the article's banner, and an article without one
            simply has no banner. Nothing is generated to stand in: covers are
            produced outside this app and uploaded in the CMS. */}
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

        {article ? (
          <div className="relative mt-10">
            <RichHtml html={article.html} />

            {/* The rail sits OUTSIDE the content box (left-full), in the page
                margin, rather than in a column beside the text. Figures, tables
                and code break 100px out of the 40rem reading column on both
                sides; a rail inside the content box would collide with them.
                Out here it starts past the furthest bleed. xl only, because
                below 1280px the margin is too narrow to hold it. */}
            <aside className="absolute top-0 left-full hidden h-full w-52 pl-6 xl:block">
              <ArticleToc headings={article.headings} />
            </aside>
          </div>
        ) : null}

        <RelatedPosts posts={morePosts} />

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

import type { Metadata } from 'next';
import { PostCard } from '@/components/post-card';
import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';
import { StatusLine } from '@/components/status-line';
import { posts as fallbackPosts } from '@/content/fallback';
import { getPosts } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Notes on Kubernetes, Rust, TypeScript, and running production infrastructure.',
};

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;

export default async function JournalPage() {
  const posts = await getPosts();
  const list = posts.length > 0 ? posts : fallbackPosts;

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <SectionHeading
        eyebrow="Journal"
        title="Notes from the field"
        description="Short write-ups on the decisions and trade-offs behind the systems I build."
      />
      {list.length > 0 ? (
        <div className="mt-10">
          {list.map((post) => (
            <PostCard key={post.documentId} post={post} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <StatusLine>Nothing published yet — the first post is on its way.</StatusLine>
        </div>
      )}
    </Section>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PostRow } from '@/components/post-row';
import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';
import { StatusLine } from '@/components/status-line';
import { SITE_PAGES } from '@/lib/site-pages';
import { getPosts, getProjects } from '@/lib/strapi';
import type { Project } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'Every page, article and case study on ssegning.com.',
};

// ISR, like the journal and work pages it lists: regenerate at most once a
// minute. A regeneration that throws (the CMS did not answer, see
// CmsUnavailableError) keeps the last good copy.
export const revalidate = 60;

/**
 * The sitemap for people: the same inventory as /sitemap.xml and
 * /sitemap-content.xml, as a page of the site rather than an XML tree.
 * (Browsers no longer style XML with XSLT -- Chrome dropped it in November
 * 2026 -- so a stylesheet on the XML files would show most readers nothing.)
 *
 * Built from the site's own pieces: the journal's rows (PostRow) for articles,
 * the same row layout for case studies, and the journal's small uppercase
 * labels over each group.
 */
export default async function SitemapPage() {
  const [posts, projects] = await Promise.all([getPosts(), getProjects()]);

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <SectionHeading
        eyebrow="Sitemap"
        title="Everything on this site"
        description="Every page, article and case study, in one place. Search engines read the same list as XML."
      />

      <Group title="Pages" count={SITE_PAGES.length}>
        <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 md:grid-cols-3">
          {SITE_PAGES.map((page) => (
            <li key={page.path}>
              <Link
                href={page.path}
                className="group -mx-4 flex items-baseline justify-between gap-4 rounded-input px-4 py-2.5 transition-colors duration-150 ease-out hover:bg-surface-1"
              >
                <span className="text-base text-ink group-hover:text-accent">{page.label}</span>
                <span aria-hidden="true" className="font-mono text-xs text-ink-muted">
                  {page.path}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Journal" count={posts.length}>
        {posts.length > 0 ? (
          posts.map((post) => <PostRow key={post.documentId} post={post} />)
        ) : (
          <StatusLine>No articles published yet.</StatusLine>
        )}
      </Group>

      <Group title="Work" count={projects.length}>
        {projects.length > 0 ? (
          projects.map((project) => <ProjectRow key={project.documentId} project={project} />)
        ) : (
          <StatusLine>No case studies published yet.</StatusLine>
        )}
      </Group>

      <p className="mt-16 border-t border-border pt-6 font-mono text-xs text-ink-muted">
        For crawlers:{' '}
        <a
          href="/sitemap.xml"
          className="whitespace-nowrap text-ink underline-offset-4 hover:text-accent hover:underline"
        >
          sitemap.xml
        </a>{' '}
        ·{' '}
        <a
          href="/sitemap-content.xml"
          className="whitespace-nowrap text-ink underline-offset-4 hover:text-accent hover:underline"
        >
          sitemap-content.xml
        </a>
      </p>
    </Section>
  );
}

/** One block of the sitemap: the journal's small uppercase label, with a count. */
function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const id = `sitemap-${title.toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
        {title} <span className="tabular-nums">· {count}</span>
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * A case study as a journal row: title, client, year. The work page shows
 * covers; here the point is to scan the whole list.
 */
function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group -mx-4 grid grid-cols-1 gap-1 rounded-input border-b border-border px-4 py-4 transition-colors duration-150 ease-out last:border-b-0 hover:bg-surface-1 sm:grid-cols-[minmax(0,1fr)_auto_7rem] sm:items-baseline sm:gap-8"
    >
      <span className="text-base text-ink text-balance group-hover:text-accent">
        {project.title}
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
        {project.client ?? 'Confidential client'}
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted tabular-nums sm:text-right">
        {project.year ?? ''}
      </span>
    </Link>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/container';
import { Markdown } from '@/components/markdown';
import { Section } from '@/components/section';
import { projects as fallbackProjects } from '@/content/fallback';
import { mediaAlt, resolveMediaUrl } from '@/lib/media';
import { getProjectBySlug, getProjects } from '@/lib/strapi';
import type { Project } from '@/lib/types';

async function resolveProject(slug: string): Promise<Project | null> {
  const project = await getProjectBySlug(slug);
  if (project) return project;
  return fallbackProjects.find((item) => item.slug === slug) ?? null;
}

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;
// Explicit so a slug missing from generateStaticParams (Strapi unreachable at build time) still renders on demand instead of 404ing.
export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await getProjects();
  const list = projects.length > 0 ? projects : fallbackProjects;
  return list.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await resolveProject(slug);
  if (!project) return {};

  const description = project.seo?.metaDescription ?? project.summary ?? undefined;

  return {
    title: project.seo?.metaTitle ?? project.title,
    description,
    openGraph: { title: project.title, description },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await resolveProject(slug);
  if (!project) notFound();

  const coverUrl = resolveMediaUrl(project.cover);

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <Container>
        <Link href="/work" className="text-sm text-ink-muted hover:text-ink">
          ← All work
        </Link>

        <h1 className="mt-4 text-display font-medium tracking-tight text-balance text-ink">
          {project.title}
        </h1>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-border py-6 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted sm:grid-cols-4">
          <div>
            <dt>Client</dt>
            <dd className="mt-1 normal-case tracking-normal text-ink">
              {project.client ?? 'Confidential'}
            </dd>
          </div>
          {project.year ? (
            <div>
              <dt>Year</dt>
              <dd className="mt-1 normal-case tracking-normal text-ink">{project.year}</dd>
            </div>
          ) : null}
          {project.tags && project.tags.length > 0 ? (
            <div className="col-span-2">
              <dt>Stack</dt>
              <dd className="mt-1 normal-case tracking-normal text-ink">
                {project.tags.join(', ')}
              </dd>
            </div>
          ) : null}
        </dl>

        {coverUrl ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-card border border-border">
            <Image
              src={coverUrl}
              alt={mediaAlt(project.cover, project.title)}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>
        ) : null}

        {project.outcome ? (
          <p className="mt-8 border-l-2 border-accent pl-4 text-lg text-ink">{project.outcome}</p>
        ) : null}

        {project.body ? (
          <div className="mt-10">
            <Markdown>{project.body}</Markdown>
          </div>
        ) : null}

        {project.url ? (
          <p className="mt-10">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              Visit the live result →
            </a>
          </p>
        ) : null}
      </Container>
    </Section>
  );
}

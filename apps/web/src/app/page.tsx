import { ArrowRight } from 'lucide-react';

import { Container } from '@/components/container';
import { LinkButton } from '@/components/link-button';
import { Markdown } from '@/components/markdown';
import { MetricStrip } from '@/components/metric-strip';
import { PostCard } from '@/components/post-card';
import { ProjectCard } from '@/components/project-card';
import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';
import { ServiceCard } from '@/components/service-card';
import { StatusLine } from '@/components/status-line';
import {
  homePage as fallbackHomePage,
  posts as fallbackPosts,
  projects as fallbackProjects,
  services as fallbackServices,
} from '@/content/fallback';
import { getHomePage, getPosts, getProjects, getServices } from '@/lib/strapi';

// Explicit ISR: the Strapi fetch helpers (src/lib/strapi.ts) swallow every fetch error into null/[], so Next never sees a completed fetch here to infer revalidation from on its own.
export const revalidate = 60;

export default async function HomePage() {
  const [home, services, projects, posts] = await Promise.all([
    getHomePage(),
    getServices(),
    getProjects(),
    getPosts(),
  ]);

  const page = home ?? fallbackHomePage;
  const featuredServices = (services.length > 0 ? services : fallbackServices).slice(0, 4);
  const featuredProjects = (projects.length > 0 ? projects : fallbackProjects).slice(0, 3);
  const featuredPosts = (posts.length > 0 ? posts : fallbackPosts).slice(0, 2);

  return (
    <>
      <Section divider={false} className="pt-16 md:pt-28">
        <Container>
          {page.heroEyebrow ? (
            <p className="font-mono text-caption uppercase tracking-[0.08em] text-accent">
              {page.heroEyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 text-display font-medium tracking-tight text-balance text-ink">
            {page.heroHeadline}
          </h1>
          {page.heroSubline ? (
            <p className="mt-6 max-w-2xl text-lg text-ink-muted">{page.heroSubline}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-4">
            {page.primaryCta ? (
              <LinkButton href={page.primaryCta.href} external={Boolean(page.primaryCta.external)}>
                {page.primaryCta.label}
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
              </LinkButton>
            ) : null}
            {page.secondaryCta ? (
              <LinkButton
                href={page.secondaryCta.href}
                external={Boolean(page.secondaryCta.external)}
                variant="ghost"
              >
                {page.secondaryCta.label}
              </LinkButton>
            ) : null}
          </div>
        </Container>
      </Section>

      {page.metrics.length > 0 ? (
        <Section>
          <MetricStrip metrics={page.metrics} />
        </Section>
      ) : null}

      {page.introTitle || page.introBody ? (
        <Section>
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {page.introTitle ? (
              <h2 className="text-heading-lg font-medium tracking-tight text-ink">
                {page.introTitle}
              </h2>
            ) : null}
            {page.introBody ? <Markdown>{page.introBody}</Markdown> : null}
          </div>
        </Section>
      ) : null}

      <Section wide>
        <SectionHeading
          eyebrow="What I do"
          title="Services"
          description="A short list, on purpose — depth on a few things, not breadth across everything."
          action={
            <LinkButton href="/services" variant="ghost">
              All services
            </LinkButton>
          }
        />
        {featuredServices.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {featuredServices.map((service) => (
              <ServiceCard key={service.documentId} service={service} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <StatusLine>Services are being updated — check back shortly.</StatusLine>
          </div>
        )}
      </Section>

      <Section wide>
        <SectionHeading
          eyebrow="Selected work"
          title="Recent engagements"
          description="A handful of the problems I've been trusted to fix."
          action={
            <LinkButton href="/work" variant="ghost">
              All work
            </LinkButton>
          }
        />
        {featuredProjects.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.documentId} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <StatusLine>Case studies are being written up — check back shortly.</StatusLine>
          </div>
        )}
      </Section>

      <Section wide={false}>
        <SectionHeading
          eyebrow="Journal"
          title="Recent writing"
          action={
            <LinkButton href="/journal" variant="ghost">
              All posts
            </LinkButton>
          }
        />
        {featuredPosts.length > 0 ? (
          <div className="mt-6">
            {featuredPosts.map((post) => (
              <PostCard key={post.documentId} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <StatusLine>Nothing published yet — the first post is on its way.</StatusLine>
          </div>
        )}
      </Section>

      <Section wide={false}>
        <div className="rounded-card border border-border p-8 text-center sm:p-12">
          <h2 className="text-heading-lg font-medium tracking-tight text-ink">
            Have a platform problem worth solving properly?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-muted">
            Tell me what you're building and where it's stuck. I read every message myself.
          </p>
          <div className="mt-6 flex justify-center">
            <LinkButton href="/contact">
              Get in touch
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
            </LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}

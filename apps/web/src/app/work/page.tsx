import type { Metadata } from 'next';
import { ProjectCard } from '@/components/project-card';
import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';
import { StatusLine } from '@/components/status-line';
import { getProjects } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Case studies from recent Kubernetes, cloud, and backend engineering engagements.',
};

// ISR: regenerate at most once a minute. A regeneration that throws (the CMS
// did not answer, see CmsUnavailableError) keeps the last good copy.
export const revalidate = 60;

export default async function WorkPage() {
  const projects = await getProjects();
  const list = projects;

  return (
    <Section divider={false} className="pt-16 md:pt-24">
      <SectionHeading
        eyebrow="Work"
        title="Case studies"
        description="A representative slice of recent engagements — the problem, what changed, and what it cost to fix."
      />
      {list.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {list.map((project) => (
            <ProjectCard key={project.documentId} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <StatusLine>Case studies are being written up — check back shortly.</StatusLine>
        </div>
      )}
    </Section>
  );
}

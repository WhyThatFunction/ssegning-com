import Image from 'next/image';
import Link from 'next/link';

import { mediaAlt, resolveMediaUrl } from '@/lib/media';
import type { Project } from '@/lib/types';

export function ProjectCard({ project }: { project: Project }) {
  const coverUrl = resolveMediaUrl(project.cover);

  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block overflow-hidden rounded-card bg-surface-1 transition-colors duration-150 ease-out hover:bg-surface-2"
    >
      <div className="relative flex aspect-[16/9] items-center justify-center bg-surface-3">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={mediaAlt(project.cover, project.title)}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
            {project.title}
          </p>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-baseline justify-between gap-4 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
          <span>{project.client ?? 'Confidential client'}</span>
          {project.year ? <span>{project.year}</span> : null}
        </div>
        <h3 className="mt-3 text-heading font-medium text-ink">{project.title}</h3>
        {project.summary ? <p className="mt-2 text-sm text-ink-muted">{project.summary}</p> : null}
      </div>
    </Link>
  );
}

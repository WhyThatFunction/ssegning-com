import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="font-mono text-caption uppercase tracking-[0.08em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-heading-lg font-medium tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-2 max-w-xl text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

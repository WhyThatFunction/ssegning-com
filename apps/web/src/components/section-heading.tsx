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
  const hasAside = Boolean(description || action);

  // Linear's heading-pair: the title on the left, its explanation and action
  // on the right, as two equal columns. A title stacked above its own
  // description makes every section open the same way; side by side, the
  // title reads as a label and the description as the argument.
  return (
    <div className={`grid gap-5 ${hasAside ? 'md:grid-cols-2 md:items-end md:gap-12' : ''}`}>
      <div>
        {eyebrow ? (
          <p className="font-mono text-caption uppercase tracking-[0.08em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-heading-lg font-light tracking-tight text-balance text-ink">
          {title}
        </h2>
      </div>
      {hasAside ? (
        <div className="flex flex-col items-start gap-4">
          {description ? <p className="max-w-md text-ink-muted">{description}</p> : null}
          {action ? <div className="-ml-3">{action}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

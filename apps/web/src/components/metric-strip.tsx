import type { MetricComponent } from '@/lib/types';

// Literal class strings (not built dynamically) so Tailwind's scanner can
// see and generate every one of them. The CMS-authored metric count varies
// (the home page seed ships 4, the about-page highlights 3),
// so the column count adapts instead of leaving a lonely 4th item wrapping
// under a fixed 3-column grid.
const GRID_CLASS_BY_COUNT: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function MetricStrip({ metrics }: { metrics: MetricComponent[] }) {
  if (metrics.length === 0) return null;

  const gridClass = GRID_CLASS_BY_COUNT[metrics.length] ?? 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <dl className={`grid grid-cols-1 gap-8 border-t border-border pt-8 ${gridClass}`}>
      {metrics.map((metric) => (
        <div key={metric.id}>
          {/* Ink, not accent, and the display face at weight 300: four
              orange numerals in a row would make the accent the loudest
              thing on the page, and it is meant to stay rare. Size still
              carries the emphasis. */}
          <dd className="text-3xl font-light tracking-tight text-ink">{metric.value}</dd>
          <dt className="mt-1 text-sm text-ink">{metric.label}</dt>
          {metric.detail ? <p className="mt-0.5 text-sm text-ink-muted">{metric.detail}</p> : null}
        </div>
      ))}
    </dl>
  );
}

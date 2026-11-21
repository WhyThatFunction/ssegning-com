import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Material 3's button hierarchy, in order of emphasis.
 *
 * - `primary`: filled with the ink colour. The page's single most important
 *   action; at most one per view.
 * - `tonal`: filled with the accent container. Secondary actions, and the
 *   place the accent appears at size -- the saturated accent itself stays rare.
 * - `ghost`: outlined. Tertiary actions.
 * - `text`: no container. Navigation ("All posts →").
 *
 * All four are 44px pills, so emphasis comes from fill alone and a row of
 * mixed buttons still lines up.
 */
type Variant = 'primary' | 'tonal' | 'ghost' | 'text';

const baseClasses =
  'inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 text-sm font-medium transition-colors duration-150 ease-out';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-canvas hover:bg-ink/90',
  tonal: 'bg-accent-container text-on-accent-container hover:bg-accent-container/80',
  ghost: 'border border-border-strong text-ink hover:border-ink-muted hover:bg-surface-1',
  text: 'px-3 text-accent hover:bg-surface-2',
};

export function LinkButton({
  href,
  external = false,
  variant = 'primary',
  children,
}: {
  href: string;
  external?: boolean;
  variant?: Variant;
  children: ReactNode;
}) {
  const className = `${baseClasses} ${variantClasses[variant]}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

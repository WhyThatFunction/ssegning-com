import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'ghost';

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-control px-5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out';

const variantClasses: Record<Variant, string> = {
  primary: 'border border-accent text-accent hover:bg-accent hover:text-accent-ink',
  ghost: 'border border-border text-ink hover:border-border-strong',
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

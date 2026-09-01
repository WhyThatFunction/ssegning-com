import type { ReactNode } from 'react';

import { Container } from '@/components/container';

export function Section({
  children,
  wide = true,
  divider = true,
  className = '',
}: {
  children: ReactNode;
  wide?: boolean;
  divider?: boolean;
  className?: string;
}) {
  return (
    <section className={`${divider ? 'border-t border-border' : ''} py-14 md:py-24 ${className}`}>
      <Container wide={wide}>{children}</Container>
    </section>
  );
}

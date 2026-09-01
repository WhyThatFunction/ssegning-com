import type { ReactNode } from 'react';

export function Container({
  children,
  className = '',
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto w-full px-6 sm:px-8 ${wide ? 'max-w-6xl' : 'max-w-4xl'} ${className}`}>
      {children}
    </div>
  );
}

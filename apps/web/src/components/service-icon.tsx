import { icons } from 'lucide-react';

import { toPascalCase } from '@/lib/icon-name';

const FALLBACK_ICON = 'Wrench';

export function ServiceIcon({ name, className }: { name: string | null; className?: string }) {
  const pascalName = name ? toPascalCase(name) : FALLBACK_ICON;
  const IconComponent =
    (icons as Record<string, (typeof icons)[keyof typeof icons] | undefined>)[pascalName] ??
    icons[FALLBACK_ICON];

  return <IconComponent aria-hidden="true" className={className} strokeWidth={1.5} />;
}

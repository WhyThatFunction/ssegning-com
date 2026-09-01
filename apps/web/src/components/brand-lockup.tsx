import { BrandMark, type BrandMarkVariant } from '@/components/brand-mark';

/**
 * Mark + wordmark, horizontal. Deliberately not a link itself — wrap it in
 * a `next/link` where a click target is needed (see site-header.tsx) so
 * this stays reusable on the /branding reference page as inert visual
 * content too.
 */
export function BrandLockup({
  label,
  size = 22,
  variant = 'mono',
  className = '',
}: {
  label: string;
  size?: number;
  variant?: BrandMarkVariant;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <BrandMark size={size} variant={variant} />
      <span className="font-mono text-sm font-medium tracking-tight">{label}</span>
    </span>
  );
}

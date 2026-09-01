/**
 * The ssegning.com brand mark: two offset squircles combined with an
 * evenodd fill rule, so their overlap cancels out into a transparent
 * rounded-lens gap instead of a flat double-fill. The result is two
 * crescent masses connected by a diagonal negative-space window —
 * abstract, not literal, and legible from a 16px favicon up to a full
 * hero treatment. See apps/web/DESIGN.md ("Brand mark") for the
 * alternatives considered and why this direction won.
 *
 * Pure SVG, single `currentColor` fill — no gradients, no stroke+fill
 * mixing. `variant` swaps the inherited color for the two situations the
 * mark needs beyond plain monochrome: sitting on the accent color, and
 * sitting reversed on a filled ink/accent surface.
 */

const MARK_PATH =
  'M20 6H32A14 14 0 0 1 46 20V32A14 14 0 0 1 32 46H20A14 14 0 0 1 6 32V20A14 14 0 0 1 20 6Z ' +
  'M32 18H46A14 14 0 0 1 58 32V46A14 14 0 0 1 46 58H32A14 14 0 0 1 18 46V32A14 14 0 0 1 32 18Z';

export type BrandMarkVariant = 'mono' | 'accent' | 'reversed';

const VARIANT_CLASSES: Record<BrandMarkVariant, string> = {
  // Inherits whatever text color the caller is set in (default, currentColor).
  mono: '',
  // Forces the accent color regardless of surrounding text color.
  accent: 'text-accent',
  // For placement on a filled ink/accent surface: forces the canvas color.
  reversed: 'text-canvas',
};

export function BrandMark({
  size = 32,
  variant = 'mono',
  className = '',
}: {
  size?: number;
  variant?: BrandMarkVariant;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
      className={`${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      <path fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

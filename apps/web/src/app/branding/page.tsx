import type { Metadata } from 'next';

import { BrandLockup } from '@/components/brand-lockup';
import { BrandMark } from '@/components/brand-mark';
import { CopyMarkSourceButton } from '@/components/copy-mark-source-button';
import { Section } from '@/components/section';
import { SectionHeading } from '@/components/section-heading';

export const metadata: Metadata = {
  title: 'Branding',
  description:
    'The ssegning.com brand mark, color palette, typography scale, and usage guidelines — mark variants, clear space, and misuse examples.',
};

// This page reads no CMS data (unlike the rest of the site, which sets
// `revalidate = 60` because the Strapi fetch helpers swallow errors into
// null/[] and Next can't infer a revalidation window from that). Everything
// here is hand-authored reference content, so it's fully static.
export const dynamic = 'force-static';

const MARK_SOURCE = `<svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path
    fill-rule="evenodd"
    d="M20 6H32A14 14 0 0 1 46 20V32A14 14 0 0 1 32 46H20A14 14 0 0 1 6 32V20A14 14 0 0 1 20 6Z
       M32 18H46A14 14 0 0 1 58 32V46A14 14 0 0 1 46 58H32A14 14 0 0 1 18 46V32A14 14 0 0 1 32 18Z"
  />
</svg>`;

const TOKEN_ROWS: Array<{ name: string; light: string; dark: string; role: string }> = [
  { name: '--color-canvas', light: '#ffffff', dark: '#08090a', role: 'Page background' },
  {
    name: '--color-canvas-subtle',
    light: '#f6f6f5',
    dark: '#131315',
    role: 'Recessed surface (skip link, code blocks)',
  },
  { name: '--color-surface', light: '#ffffff', dark: '#17181a', role: 'Cards, panels' },
  { name: '--color-border', light: '#e6e4e1', dark: '#2a2b2e', role: 'Hairline dividers' },
  { name: '--color-border-strong', light: '#d8d5d1', dark: '#3a3b3f', role: 'Hover border state' },
  { name: '--color-ink', light: '#0a0a0a', dark: '#f7f7f6', role: 'Primary text' },
  { name: '--color-ink-muted', light: '#6b6a68', dark: '#9a9a9a', role: 'Secondary text' },
  {
    name: '--color-accent',
    light: '#c2410c',
    dark: '#fb923c',
    role: 'Links, focus ring, CTA, emphasis — never a fill/background',
  },
  {
    name: '--color-accent-ink',
    light: '#ffffff',
    dark: '#171717',
    role: 'Text on a filled accent surface',
  },
  { name: '--color-danger', light: '#b3261e', dark: '#ff6f61', role: 'Error states' },
];

const TYPE_SCALE: Array<{ token: string; className: string; sample: string; spec: string }> = [
  {
    token: 'text-display',
    className: 'text-display font-medium tracking-tight',
    sample: 'Platform engineering',
    spec: 'clamp(2.25rem, 1.65rem + 2.6vw, 3.25rem) / 1.1 / -0.02em',
  },
  {
    token: 'text-heading-lg',
    className: 'text-heading-lg font-medium tracking-tight',
    sample: 'What I can take off your plate',
    spec: 'clamp(1.5rem, 1.2rem + 1.3vw, 2.25rem) / 1.15 / -0.015em',
  },
  {
    token: 'text-heading',
    className: 'text-heading font-medium tracking-tight',
    sample: 'Kubernetes Platform Builds',
    spec: '1.375rem / 1.25 / -0.01em',
  },
  {
    token: 'text-subheading',
    className: 'text-subheading',
    sample: "Let's talk about what you're building.",
    spec: '1.125rem / 1.4',
  },
  {
    token: 'text-base (body)',
    className: 'text-base',
    sample: 'I design, build, and operate Kubernetes platforms and the services that run on them.',
    spec: '1rem / 1.5, system sans',
  },
  {
    token: 'text-caption',
    className: 'text-caption font-mono uppercase tracking-[0.08em] text-accent',
    sample: 'Independent consultancy',
    spec: '0.8125rem / 1.4 / 0.08em, mono, uppercase',
  },
];

export default function BrandingPage() {
  return (
    <>
      <Section divider={false} className="pt-16 md:pt-24">
        <SectionHeading
          eyebrow="Brand"
          title="Mark & identity"
          description="A reference page for the ssegning.com mark: the geometry it's built from, its variants, the space it needs to breathe, and the ways not to use it."
        />
      </Section>

      {/* The mark, on both light and dark surfaces */}
      <Section>
        <h2 className="text-heading font-medium tracking-tight text-ink">The mark</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Two offset squircles, combined with an evenodd fill so their overlap cancels into a
          transparent lens instead of a flat double-fill. Two masses, one shared negative space —
          not a letterform, not a literal object.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div
            className="flex items-center justify-center rounded-card border border-border py-20"
            style={{ backgroundColor: '#ffffff' }}
          >
            <BrandMark size={140} className="text-[#0a0a0a]" />
          </div>
          <div
            className="flex items-center justify-center rounded-card py-20"
            style={{ backgroundColor: '#08090a' }}
          >
            <BrandMark size={140} className="text-[#f7f7f6]" />
          </div>
        </div>
      </Section>

      {/* Variants */}
      <Section>
        <h2 className="text-heading font-medium tracking-tight text-ink">Variants</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Monochrome is the default — the mark inherits{' '}
          <code className="font-mono">currentColor</code> from whatever text color it sits in.
          Accent and reversed are explicit overrides for the two situations that come up on this
          site.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-card border border-border p-6">
            <p className="font-mono text-caption uppercase tracking-[0.08em] text-ink-muted">
              Monochrome
            </p>
            <p className="mt-1 text-sm text-ink-muted">Default. Inherits text color.</p>
            <div className="mt-6 flex items-end justify-center gap-6 text-ink">
              <BrandMark size={16} />
              <BrandMark size={24} />
              <BrandMark size={40} />
              <BrandMark size={64} />
            </div>
          </div>
          <div className="rounded-card border border-border p-6">
            <p className="font-mono text-caption uppercase tracking-[0.08em] text-ink-muted">
              Accent
            </p>
            <p className="mt-1 text-sm text-ink-muted">Forces the accent color.</p>
            <div className="mt-6 flex items-end justify-center gap-6">
              <BrandMark size={16} variant="accent" />
              <BrandMark size={24} variant="accent" />
              <BrandMark size={40} variant="accent" />
              <BrandMark size={64} variant="accent" />
            </div>
          </div>
          <div className="rounded-card p-6" style={{ backgroundColor: '#08090a' }}>
            <p className="font-mono text-caption uppercase tracking-[0.08em] text-[#9a9a9a]">
              Reversed
            </p>
            <p className="mt-1 text-sm text-[#9a9a9a]">For a filled ink or accent surface.</p>
            <div className="mt-6 flex items-end justify-center gap-6">
              <BrandMark size={16} variant="reversed" className="text-[#f7f7f6]" />
              <BrandMark size={24} variant="reversed" className="text-[#f7f7f6]" />
              <BrandMark size={40} variant="reversed" className="text-[#f7f7f6]" />
              <BrandMark size={64} variant="reversed" className="text-[#f7f7f6]" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-card border border-border p-4">
          <BrandMark size={16} />
          <p className="text-sm text-ink-muted">
            16px, actual favicon scale, shown at native size next to this line — the two crescents
            and the gap between them still read as a mark, not a smudge.
          </p>
        </div>
      </Section>

      {/* Lockup + clear space */}
      <Section>
        <h2 className="text-heading font-medium tracking-tight text-ink">Lockup & clear space</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Mark and wordmark sit on the wordmark's baseline with a fixed gap — see{' '}
          <code className="font-mono">brand-lockup.tsx</code>. Keep clear space of at least a
          quarter of the mark's height on every side: no text, rule, or edge inside that margin.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-10">
          <div className="rounded-card border border-border p-6">
            <BrandLockup label="Stephane Segning Lambou" size={24} />
          </div>
          <div className="relative rounded-card border border-dashed border-border-strong p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-input border border-dashed border-accent/40"
            />
            <BrandMark size={64} />
            <p className="mt-4 max-w-[12rem] font-mono text-caption text-ink-muted">
              Clear space ≥ ¼ mark height, shown here as the dashed inner boundary
            </p>
          </div>
        </div>
      </Section>

      {/* Misuse */}
      <Section>
        <h2 className="text-heading font-medium tracking-tight text-ink">Misuse</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          The mark is a single-color, single-piece geometry. These four changes are the ones most
          likely to get reached for — don't.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-border p-6">
            <div className="flex h-28 items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <title>Example: the mark recolored per shape, which is not allowed</title>
                <path
                  fill="#c2410c"
                  d="M20 6H32A14 14 0 0 1 46 20V32A14 14 0 0 1 32 46H20A14 14 0 0 1 6 32V20A14 14 0 0 1 20 6Z"
                />
                <path
                  fill="#2563eb"
                  d="M32 18H46A14 14 0 0 1 58 32V46A14 14 0 0 1 46 58H32A14 14 0 0 1 18 46V32A14 14 0 0 1 32 18Z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-danger">Don't recolor per shape</p>
            <p className="mt-1 text-sm text-ink-muted">
              One fill, one color. Splitting the two masses into different colors breaks the
              negative-space read.
            </p>
          </div>
          <div className="rounded-card border border-border p-6">
            <div className="flex h-28 items-center justify-center">
              <div style={{ transform: 'scaleX(1.9) scaleY(0.55)' }} className="text-ink">
                <BrandMark size={64} />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-danger">Don't stretch</p>
            <p className="mt-1 text-sm text-ink-muted">
              The squircle geometry only holds its proportions at 1:1. Scale it uniformly or not at
              all.
            </p>
          </div>
          <div className="rounded-card border border-border p-6">
            <div className="flex h-28 items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(6px 8px 6px rgba(0,0,0,0.45))' }}
              >
                <title>
                  Example: the mark with a gradient fill and a drop shadow, which is not allowed
                </title>
                <defs>
                  <linearGradient id="misuse-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fb923c" />
                    <stop offset="1" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#misuse-gradient)"
                  fillRule="evenodd"
                  d="M20 6H32A14 14 0 0 1 46 20V32A14 14 0 0 1 32 46H20A14 14 0 0 1 6 32V20A14 14 0 0 1 20 6Z
                     M32 18H46A14 14 0 0 1 58 32V46A14 14 0 0 1 46 58H32A14 14 0 0 1 18 46V32A14 14 0 0 1 32 18Z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-danger">Don't add effects</p>
            <p className="mt-1 text-sm text-ink-muted">
              No gradients, no drop shadows. The site's whole visual language is flat surfaces and
              hairline borders — the mark follows the same rule.
            </p>
          </div>
          <div className="rounded-card border border-border p-3">
            <div className="flex h-28 items-center justify-center gap-1 overflow-hidden text-ink">
              <BrandMark size={64} />
              <BrandMark size={64} className="-ml-8" />
              <span className="-ml-4 text-heading font-medium tracking-tight">
                Stephane Segning Lambou is a software and platform engineer
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-danger">Don't crowd it</p>
            <p className="mt-1 text-sm text-ink-muted">
              No text, panel edge, or second mark inside the clear-space margin defined above.
            </p>
          </div>
        </div>
      </Section>

      {/* Color palette */}
      <Section>
        <h2 className="text-heading font-medium tracking-tight text-ink">Color</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Achromatic canvas and ink, plus a single rust/copper accent — reserved for links, focus
          rings, the primary CTA, and metric emphasis. Never a background or a decorative fill.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-caption uppercase tracking-[0.08em] text-ink-muted">
                <th className="py-3 pr-4 font-medium">Token</th>
                <th className="py-3 pr-4 font-medium">Light</th>
                <th className="py-3 pr-4 font-medium">Dark</th>
                <th className="py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {TOKEN_ROWS.map((row) => (
                <tr key={row.name} className="border-b border-border">
                  <td className="py-3 pr-4 font-mono text-ink">{row.name}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border border-border-strong"
                        style={{ backgroundColor: row.light }}
                      />
                      <span className="font-mono text-ink-muted">{row.light}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border border-border-strong"
                        style={{ backgroundColor: row.dark }}
                      />
                      <span className="font-mono text-ink-muted">{row.dark}</span>
                    </span>
                  </td>
                  <td className="py-3 text-ink-muted">{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Typography */}
      <Section>
        <h2 className="text-heading font-medium tracking-tight text-ink">Typography</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          The type scale actually in use across the site, from{' '}
          <code className="font-mono">globals.css</code>. System sans for UI/body, system mono
          reserved for numerals, dates, and eyebrow labels.
        </p>
        <div className="mt-8 divide-y divide-border border-t border-border">
          {TYPE_SCALE.map((row) => (
            <div key={row.token} className="grid gap-2 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <div>
                <p className="font-mono text-xs text-ink-muted">{row.token}</p>
                <p className="mt-1 font-mono text-xs text-ink-muted">{row.spec}</p>
              </div>
              <p className={`${row.className} text-ink`}>{row.sample}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Raw source */}
      <Section divider className="pb-24">
        <h2 className="text-heading font-medium tracking-tight text-ink">Raw SVG source</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          This page can't hand you a file to save — select the markup below, or copy it straight to
          the clipboard.
        </p>
        <div className="mt-6 rounded-card border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-mono text-caption uppercase tracking-[0.08em] text-ink-muted">
              brand-mark.svg
            </p>
            <CopyMarkSourceButton source={MARK_SOURCE} />
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-ink">
            <code className="font-mono">{MARK_SOURCE}</code>
          </pre>
        </div>
      </Section>
    </>
  );
}

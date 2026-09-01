# Design — ssegning.com marketing site

Research-first design record for `apps/web`, per the `refero-design` skill. This
file is the reference lock + decision ledger for the site. Read this before
changing layout, type scale, spacing, or color.

## Research summary

- Styles reviewed: 9, across three angles — restrained editorial portfolios
  (Mike Matas, Daniël van der Winden, Christopher Ireland, Spacelab, INK,
  Aaron Poe & Co, Dennis Snellenberg, Julia Krantz, David Kirschberg, Linus
  Rogge), dark/monochrome devtools systems (Linear Changelog, shadcn/ui, Three,
  099, Elementor, Trunk, Vapi, Checkly, Active Theory, Warp), and premium
  agency/case-study composition (Exo Ape, Medium, Fiasco, Handhold, Liron
  Moran Interiors).
- Full style pulls: Linear Changelog (`11d3e58a-…`), shadcn/ui (`c14c0a94-…`),
  Mike Matas (`749d923d-…`).
- Screens reviewed: 2 — Vercel `/experts` (expert-directory card grid, dark),
  Canva `/case-studies` (case-study grid + detail structure, light).

## Reference lock

```
Primary reference: Linear Changelog (dark) + shadcn/ui (light) — treated as one
  system, since both are disciplined monochrome technical design languages
  that only differ by canvas polarity. This is the site's dominant direction:
  a "midnight command center" for dark mode and a "monochrome blueprint" for
  light mode, never a warm/cream editorial hybrid.

Preserve:
  - Achromatic canvas + text; color is reserved for exactly one functional
    accent, never for decoration.
  - Headline weight is medium (500-600), never heavy/black — authority through
    restraint, not boldness.
  - 1px hairline borders for separation and elevation; no drop shadows beyond
    a 1px inset/outline. Depth comes from tonal surface steps, not blur/shadow.
  - Pill radius (9999px) for buttons/pills/tags; a smaller, distinct radius
    (12px) for cards/panels — never the same radius for both.
  - Compact, technical type rhythm: tight letter-spacing on headings, mono
    typeface reserved for numerals/labels/timestamps/code only.

Borrow only:
  - From Mike Matas: the left-aligned, type-led hero with no decorative
    imagery, and confidence to let whitespace and type size alone carry
    hierarchy (no hero illustration, no gradient).
  - From Vercel /experts + Canva /case-studies: card-grid index structure for
    /services and /work, and a detail page that opens with a compact
    metadata/outcome strip before the long-form body.

Role rules:
  - Mono font role = numerals, dates, eyebrows/labels, code — never body copy.
  - Accent color role = links, focus rings, primary CTA fill/border, active nav
    state, metric emphasis — never backgrounds, never decorative fills.
  - Pill radius role = interactive controls only (buttons, tags, nav pills).
    Card/panel radius stays at the smaller, distinct value.

Media strategy: no photography, no illustration, no device mockups (breaks
  the reference's "type does the work" rule and there is no real product
  screenshot to show — this is a services/consultancy site, not a SaaS
  product). Cover images for case studies are Strapi-supplied; where absent,
  fall back to a plain bordered panel carrying the project title in mono
  label style rather than a fake gradient placeholder.

Reject: warm ivory/cream canvas, serif display headline, decorative
  italic/script word-swap, indigo/violet default accent, glassmorphism,
  gradient hero bands, drop shadows, centered hero with a giant illustration.

Token commitments: see below.
```

## Decision ledger

| Decision | Source | Source rule / role | Why |
|---|---|---|---|
| Two canvases: near-black `#08090a` dark / near-white `#ffffff` light, both with a single near-black or near-white ink color for text | Linear Changelog + shadcn/ui | `--color-canvas-*`, `--color-text-*` roles | Both refs independently converge on this; it's the calm/no-decoration baseline the brief demands. |
| One accent color: a muted rust/copper (`#c2410c` light / `#fb923c` dark), used only for links, focus ring, primary CTA border+text, and metric values | Craft rule (house: "one accent used sparingly") + user content constraint (Rust language is part of the consultancy's stack) | Accent = interactive/emphasis only, never fill/background | Ties the accent literally to "Rust" (a named specialty in the seed content) without being decorative; avoids the indigo/violet default the skill explicitly flags. |
| System font stack for UI/body (`-apple-system, "Segoe UI", Inter, Roboto, Helvetica Neue, Arial, sans-serif`) instead of `next/font/google` | Brief's explicit fallback clause + release-engineering rule against build steps that need network access | n/a | This repo builds a Docker image in CI; a Google Fonts fetch at build time is a real, previously-seen failure class (network flake / offline builder) for no visual gain, since the system stack already renders Inter-like geometry on every modern OS. Documented per brief's "decide and say which you chose." |
| System mono stack (`ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Consolas, monospace`) for numerals, eyebrows, dates, nav "index" labels | Linear Changelog | Berkeley Mono role → numerals/timestamps/code only | Same offline-build reasoning as above; role preserved exactly as in the reference (never body text). |
| Pill (9999px) radius for buttons/tags/nav-pills; 12px radius for cards; 8px for inputs | Linear Changelog (pill buttons, 8px cards) + shadcn/ui (10px input, 14px card) | Radius-per-role, not a single global radius | Splits the difference between the two primary refs while keeping the "two distinct radii, never one" rule from both. |
| 1px hairline borders everywhere; shadows limited to a 1px inset ring on focus/hover | Linear Changelog + shadcn/ui "Don't use heavy shadows" | Elevation via borders/tonal steps | Explicit "Don't" in both primary style refs. |
| Hero: left-aligned headline + eyebrow + subline + two CTAs, no image, on both canvases | Mike Matas | "Type is the primary visual element" | Matches the brief's "no gradient soup / no AI slop" instruction and gives a distinct, non-generic hero. |
| Metrics strip rendered as a mono-numeral row under the hero (label/value/detail triplets) | `shared.metric` content model + Linear Changelog mono-for-numerals role | n/a | Content model already provides label/value/detail; mono treatment gives it a "readout" feel consistent with the accent's technical framing. |
| /services and /work render as a single-column list of bordered rows (not a 3-up card grid) on mobile, 2-up bordered panel grid on desktop | Vercel `/experts` (card grid) adapted down | Card → bordered panel, no shadow | A solo consultancy has 3-4 services and 2-3 projects — a dense grid built for dozens of cards would look sparse; a restrained row/panel list reads intentional at this content volume. |
| Case-study detail opens with client / year / outcome as a compact mono metadata strip before the long-form markdown body | Canva `/case-studies` detail structure | Metadata-before-body pattern | Concrete UI pattern from screens research, adapted to remove Canva's color/gradient treatment. |
| No photography/illustration/device mockups anywhere in the UI chrome | Mike Matas ("product showcase, no lifestyle photography") + practical constraint (no real product screenshots exist for a consulting practice) | Imagery role = project cover images only, sourced from CMS | Prevents "AI slop" decorative filler; only real, CMS-authored imagery appears, and it degrades to a plain bordered label panel when absent. |
| Empty/degraded states (Strapi down, no posts yet, no projects yet) render as a single inline status line in the same type scale as surrounding body text | House design philosophy (project CLAUDE.md: "Empty states are inline status lines, not centered placards") | n/a | Explicit house rule; also matches the calm, non-alarming tone the rest of the system uses for "content missing" states. |

## Token commitments

```
Light                          Dark
--canvas:        #ffffff       #08090a
--canvas-subtle: #f6f6f5       #131315
--surface:       #ffffff       #17181a
--border:        #e6e4e1       #2a2b2e
--border-strong: #d8d5d1       #3a3b3f
--ink:           #0a0a0a       #f7f7f6
--ink-muted:     #6b6a68       #9a9a9a
--accent:        #c2410c       #fb923c
--accent-ink:    #ffffff       #171717   (text on filled accent surfaces)
--danger:        #b3261e       #ff6f61

Radius: control (button/tag/pill) 9999px · card/panel 12px · input 8px
Border: 1px solid var(--border); focus ring 2px solid var(--accent), 2px offset
Type: system sans for all UI/body; system mono for eyebrows, dates, metric
  values, nav index numbers, footer coordinates
Scale (rem): display 3.25/2.25 (desktop/mobile), heading-lg 2.25, heading 1.5,
  subheading 1.125, body 1, body-sm 0.9375, caption 0.8125 (mono, uppercase,
  tracking .08em)
Spacing rhythm: section padding-block 6rem desktop / 3.5rem mobile; content
  max-width 72rem (1152px) for grids, 40rem (640px) for long-form prose
Motion: 150ms ease-out for hover/focus transitions only; instantly disabled
  under prefers-reduced-motion
```

## Quality gate (self-check)

- Used styles for visual taste: yes (Linear Changelog, shadcn/ui, Mike Matas
  full pulls; six more previewed for triangulation).
- Avoided copying one style directly: yes — dark/light system merged from two
  sources, hero borrowed from a third, no single site cloned.
- Avoided averaging into a safe centroid: yes — kept the achromatic-plus-one-
  accent extremity rather than drifting toward a generic blue SaaS palette.
- Preserved primary references' signature traits: yes — pill-vs-card radius
  split, hairline borders, mono-for-numerals-only, medium-weight headlines.
- Preserved token/component roles: yes — accent never used as a fill/bg, mono
  never used as body copy.
- Used screens for concrete patterns: yes — grid/list index and metadata-
  before-body detail structure.
- Rejected warm/cream/serif/indigo defaults: yes, explicitly in "Reject" above.

## Brand mark

Added when building `/branding` and wiring the mark into site identity
(header, favicon, OG image). Read this before touching
`brand-mark.tsx`/`brand-lockup.tsx` or the `/branding` page.

### Research

- Styles reviewed for visual taste (via `refero_search_styles`): LogoArchive,
  Elementor, Hashnode, iconwerk, Ghost, shadcn/ui — reconfirming the existing
  monochrome-plus-one-accent language rather than introducing a new one for
  the mark.
- Screens reviewed for concrete brand-guideline-page structure (via
  `refero_search_screens`, full pulls via `refero_get_screen`): **Linear
  Brand Guidelines** (`linear.app/brand`) — wordmark/logo/icon shown as
  three-card rows per color variation, color swatches with hex/name; **Runway
  Brand Assets & Guidelines** (`runwayml.com/brand-guidelines`) — minimum
  size, legibility-on-background, a clear-space grid overlay, and a "Don'ts"
  grid with crossed-out misuse examples; **Creative Market Logo & Branding
  Guidelines** (`creativemarket.com/brand`) — a two-column "you should / you
  should not" table. YouTube's icon-guidelines page and Wix's design-assets
  page were previewed but not pulled in full (same pattern family, no new
  detail).

### Reference lock (page structure)

```
Primary reference: Runway brand-guidelines, for the page skeleton — mark on
  light/dark, clear-space diagram, explicit misuse examples with a red
  "don't" label instead of prose bullets.
Borrow: Linear's card-row pattern for showing variants side by side; Creative
  Market's you-should/you-should-not framing (adapted here into 4 concrete
  misuse renders rather than a text table, per this project's house rule that
  a "don't" is shown, not just stated).
Reject: any of the three references' own color systems, wordmark type, or
  layout chrome — this page stays inside ssegning.com's existing hairline-
  border, achromatic-plus-accent system (see reference lock above); it does
  not adopt Linear's purple, Runway's centered hero, or Creative Market's
  teal links.
```

### The mark: three directions explored, and why the winner won

All three were rendered together (light/dark canvas, 16px/64px/400px, mono
and accent) in a throwaway HTML harness before any code was written, per the
skill's "render each, look at each" requirement.

1. **Vesica** (shipped) — two 40×40 squircles (`rx=14`), offset diagonally by
   (12, 12), combined in one `<path>` with `fill-rule="evenodd"`. Because the
   two rounded-rect subpaths overlap, evenodd cancels the overlap into a
   transparent rounded lens instead of a flat double-fill — two crescent
   masses sharing one diagonal negative-space window. Reads as two distinct
   forms at 400px, still reads as one coherent mark (not a smudge) at 16px,
   because the shapes are large and the cut is a single clean diagonal
   rather than fine detail.
2. **Stacked Frames** — two offset squircle rings (stroke-only rounded
   squares, no fill), overlapping like two window frames. Rejected: at 16px
   the strokes visually fuse into a blob with no legible structure, and at
   any size it reads too close to a generic "chain link / integration"
   icon — exactly the kind of literal, done-a-thousand-times connector glyph
   the brief's "not literal" constraint is aimed at, even though a chain
   link isn't on the explicit ban list.
3. **Triad Clover** — three 24×24 squircles (`rx=9`) arranged with exact
   120° rotational symmetry around a center point (computed via
   sin/cos 120°, not eyeballed). Rejected: at the overlap needed to keep the
   three lobes touching, same-color fill merges them into one undifferentiated
   rounded-triangle blob — the "three rounded masses" premise disappears
   entirely, both at 400px and 16px, leaving a shape with no more identity
   than a plain rounded triangle.

Vesica won because it's the only direction whose defining structure (two
masses + a shared gap) survives being shrunk to a 16px favicon, and because
its negative-space diagonal is the closest fit to the brief's "S emerges
from the geometry" prompt without drawing a letterform — the diagonal flow
through the lens reads as movement/connection, not as a rendered "S".

### The mark: implementation

```
Path (viewBox 0 0 64 64, fill-rule evenodd, fill="currentColor"):
M20 6H32A14 14 0 0 1 46 20V32A14 14 0 0 1 32 46H20A14 14 0 0 1 6 32V20A14 14 0 0 1 20 6Z
M32 18H46A14 14 0 0 1 58 32V46A14 14 0 0 1 46 58H32A14 14 0 0 1 18 46V32A14 14 0 0 1 32 18Z
```

- `src/components/brand-mark.tsx` — `BrandMark({ size, variant, className })`.
  `variant: 'mono'` (default, inherits `currentColor`), `'accent'` (forces
  `text-accent`), `'reversed'` (forces `text-canvas`, for a filled ink/accent
  surface). Always `aria-hidden` — it's decorative; the accessible name comes
  from the adjacent wordmark text (see `BrandLockup`).
- `src/components/brand-lockup.tsx` — `BrandLockup({ label, size, variant })`,
  mark + wordmark in an `inline-flex`. Deliberately not a link itself, so
  `site-header.tsx` can wrap it in `next/link` while `/branding` uses it
  inert.
- `src/app/icon.svg` — same geometry, hardcoded `#0a0a0a` fill (favicons have
  no `currentColor` context) — Next's App Router picks this up automatically
  as the site favicon.
- `src/app/opengraph-image.tsx` — same path literal (not the shared
  component: `next/og`'s Satori renderer doesn't process Tailwind classes or
  resolve `currentColor`), accent-colored, placed above the site name.

### Quality gate (self-check)

- Used styles/screens for a real branding-page pattern, not vibe memory: yes
  (Linear, Runway, Creative Market, above).
- Avoided copying one reference directly: yes — page structure synthesized
  from three sources, color/type system stays the site's own throughout.
- Explored genuinely different directions, not variations on one idea: yes —
  negative-space overlap, stroke rings, and rotational-symmetry fill are
  structurally distinct construction methods, not the same shape recolored.
- Rendered and looked at every direction before choosing, at both the
  favicon and hero size: yes.
- Rejected the two weaker directions for stated, size-specific reasons
  rather than taste alone: yes.
- Avoided the literal/banned forms (cloud, server rack, helm wheel, hexagon,
  infinity loop, drawn letterform): yes.
- Monochrome-first, single `currentColor` fill, no gradient/shadow/stroke+fill
  mixing: yes.

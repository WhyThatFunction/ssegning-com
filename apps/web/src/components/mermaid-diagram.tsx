'use client';

import { useEffect, useId, useRef, useState } from 'react';

type RenderState = 'loading' | 'ok' | 'error';

// Matches --font-sans in apps/web/src/app/globals.css. Kept as a literal
// (rather than read from the DOM) since it never changes with the theme.
const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Reads a resolved (hex/rgb) value for a CSS custom property off the live
 * document, falling back if it's unset (e.g. during SSR or a test DOM).
 *
 * Mermaid can't take `var(--...)` strings directly as theme colors: its
 * `base` theme runs every color through `khroma` to derive shades (hover
 * states, subgraph backgrounds, etc.), and `khroma` throws
 * `Unsupported color format` on an unresolved CSS variable reference. Reading
 * the already-computed value here — which the browser has already resolved
 * against the current light/dark cascade in globals.css — is what makes the
 * diagram theme-aware without mermaid ever seeing a `var(...)` token.
 */
function readColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Builds mermaid's `base`-theme variables from the site's current design tokens. */
function buildThemeVariables() {
  const canvas = readColor('--color-canvas', '#ffffff');
  const canvasSubtle = readColor('--color-canvas-subtle', '#f6f6f5');
  const surface = readColor('--color-surface', '#ffffff');
  const border = readColor('--color-border', '#e6e4e1');
  const borderStrong = readColor('--color-border-strong', '#d8d5d1');
  const ink = readColor('--color-ink', '#0a0a0a');
  const inkMuted = readColor('--color-ink-muted', '#6b6a68');
  const accent = readColor('--color-accent', '#c2410c');
  const accentInk = readColor('--color-accent-ink', '#ffffff');
  const danger = readColor('--color-danger', '#b3261e');

  return {
    background: canvas,
    primaryColor: canvasSubtle,
    primaryTextColor: ink,
    primaryBorderColor: borderStrong,
    secondaryColor: surface,
    secondaryTextColor: ink,
    secondaryBorderColor: border,
    tertiaryColor: canvasSubtle,
    tertiaryTextColor: ink,
    tertiaryBorderColor: border,
    lineColor: borderStrong,
    textColor: ink,
    mainBkg: surface,
    nodeBorder: borderStrong,
    nodeTextColor: ink,
    clusterBkg: canvasSubtle,
    clusterBorder: border,
    titleColor: ink,
    edgeLabelBackground: canvas,
    fontFamily: FONT_SANS,
    // Sequence diagrams
    actorBkg: surface,
    actorBorder: borderStrong,
    actorTextColor: ink,
    actorLineColor: borderStrong,
    signalColor: ink,
    signalTextColor: ink,
    labelBoxBkgColor: surface,
    labelBoxBorderColor: borderStrong,
    labelTextColor: ink,
    loopTextColor: ink,
    noteBkgColor: canvasSubtle,
    noteBorderColor: border,
    noteTextColor: ink,
    activationBkgColor: canvasSubtle,
    activationBorderColor: borderStrong,
    sequenceNumberColor: accentInk,
    // State diagrams
    stateBkg: surface,
    labelColor: ink,
    errorBkgColor: danger,
    errorTextColor: canvas,
    // xychart-beta (the "at most one" chart type this house style allows)
    xyChart: {
      backgroundColor: canvas,
      titleColor: ink,
      xAxisLabelColor: inkMuted,
      xAxisLineColor: borderStrong,
      yAxisLabelColor: inkMuted,
      yAxisLineColor: borderStrong,
      plotColorPalette: `${accent}, ${inkMuted}`,
    },
  };
}

/**
 * Whether the effective color scheme is dark. Passed to mermaid alongside
 * the explicit theme variables above, since mermaid's `base` theme still
 * derives a handful of colors we don't set explicitly (e.g. per-subgraph
 * accent cycling) from this flag rather than from `themeVariables`.
 */
function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return false;
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function linearizeChannel(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

function parseRgbColor(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * The house style's diagrams hand-pick per-node highlight fills right in the
 * Markdown (`style X fill:#d1fae5,stroke:#10b981` for a "good" outcome,
 * a pastel red for a "bad" one — present in every one of these 12 articles,
 * ~4-11 times each). Those fills are authored once, meant to read against a
 * light canvas, and mermaid's theme otherwise applies a single global label
 * color to every node — so in dark mode a light-on-dark label color lands on
 * top of those same light pastel fills and becomes nearly illegible.
 *
 * Since the fill is real (already resolved by the browser, custom or not),
 * each node's own contrast can be fixed after the fact: read its shape's
 * actual rendered color and pick a readable label color from its luminance,
 * instead of trusting one theme-wide text color to suit every fill an
 * article happens to use.
 */
function fixNodeLabelContrast(container: HTMLElement) {
  for (const node of Array.from(container.querySelectorAll('.node'))) {
    const shape = node.querySelector('rect, polygon, circle, ellipse, path');
    const label = node.querySelector<HTMLElement>('.nodeLabel');
    if (!shape || !label) continue;

    const rgb = parseRgbColor(getComputedStyle(shape).fill);
    if (!rgb) continue;

    label.style.color = relativeLuminance(...rgb) > 0.5 ? '#0a0a0a' : '#f7f7f6';
  }
}

/**
 * Renders a fenced ```mermaid code block as an actual diagram.
 *
 * The `mermaid` package is large and only ever `import()`-ed here, inside an
 * effect — so it is never part of the JS bundle for a page that has no
 * mermaid block, and is fetched at most once per session on a page that does.
 *
 * Falls back to the original fenced code text whenever mermaid hasn't
 * finished loading yet, fails to load, or fails to parse the diagram — a
 * broken diagram must never blank the page.
 */
export function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const diagramId = `mermaid-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RenderState>('loading');
  const [themeTick, setThemeTick] = useState(0);

  // Re-render whenever the theme flips: `buildThemeVariables()` bakes
  // resolved colors into the generated SVG at render time rather than
  // referencing live CSS variables (see its doc comment), so the SVG has to
  // be regenerated — it won't re-theme itself the way plain CSS would.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'data-theme')) {
        setThemeTick((tick) => tick + 1);
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => setThemeTick((tick) => tick + 1);
    media.addEventListener('change', onMediaChange);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', onMediaChange);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: themeTick is a change counter, never read in the body — its only job is to force this effect to re-run and regenerate the SVG when the theme flips.
  useEffect(() => {
    let cancelled = false;
    setState('loading');

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import('mermaid');

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          darkMode: isDarkTheme(),
          fontFamily: FONT_SANS,
          themeVariables: buildThemeVariables(),
        });

        const { svg } = await mermaid.render(diagramId, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          fixNodeLabelContrast(containerRef.current);
          setState('ok');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[mermaid-diagram] failed to render diagram', error);
          setState('error');
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId, themeTick]);

  return (
    <div className="mermaid-diagram">
      {state !== 'ok' ? (
        <pre>
          <code>{chart}</code>
        </pre>
      ) : null}
      <div
        ref={containerRef}
        className="mermaid-diagram-canvas"
        aria-hidden={state !== 'ok'}
        style={state === 'ok' ? undefined : { display: 'none' }}
      />
    </div>
  );
}

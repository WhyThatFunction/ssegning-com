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
    // xychart-beta. Series take the palette in the order they are declared, and
    // the house rule is one highlight per chart: declare the context series
    // first (muted), the series carrying the point second (accent), and an
    // optional reference line third (ink). To highlight one bar of a set, split
    // the set into two `bar` series with zeros where the other one has values.
    xyChart: {
      backgroundColor: canvas,
      titleColor: ink,
      xAxisLabelColor: inkMuted,
      xAxisLineColor: borderStrong,
      yAxisLabelColor: inkMuted,
      yAxisLineColor: borderStrong,
      plotColorPalette: `${inkMuted}, ${accent}, ${ink}`,
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

/** Converts sRGB channels (0-255) to HSL, all three components in 0-1. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return [0, 0, lightness];

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === rn) hue = (gn - bn) / delta + (gn < bn ? 6 : 0);
  else if (max === gn) hue = (bn - rn) / delta + 2;
  else hue = (rn - gn) / delta + 4;

  return [hue / 6, saturation, lightness];
}

/** Inverse of `rgbToHsl`. Returns sRGB channels in 0-255 (not rounded). */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    const tn = (t + 1) % 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

/** Above this relative luminance, a fill was authored for a light canvas. */
const LIGHT_FILL_LUMINANCE = 0.5;
/**
 * Where a re-toned highlight fill lands in dark mode. 0.19 keeps the hue
 * legible against `--color-canvas` without the node glowing; the saturation
 * floor stops an already-washed-out pastel collapsing into flat grey.
 */
const DARK_FILL_LIGHTNESS = 0.19;
const DARK_FILL_MIN_SATURATION = 0.45;

/**
 * Makes the house style's hand-picked highlight fills work in both themes.
 *
 * These articles mark outcomes right in the Markdown — `style X
 * fill:#d1fae5,stroke:#10b981` for a "good" outcome, a pastel red for a bad
 * one, amber for "careful" — roughly 4-11 times each, in every article. Those
 * three pastels are picked for a white page, and they are the one part of a
 * diagram mermaid's theme cannot reach: an explicit `style` directive in the
 * source beats anything in `themeVariables`.
 *
 * In dark mode that leaves a bright pastel block glowing on a near-black
 * canvas. Rather than recolour them by hand in every article (and constrain
 * every future one), each such fill is re-toned here: hue is kept, saturation
 * is kept or raised to a floor, and lightness drops to `DARK_FILL_LIGHTNESS`
 * — so green still reads as green and red as red, while the node sits in the
 * page instead of on top of it. The author's `stroke` is deliberately left
 * alone: those are saturated mid-tones that already read against either
 * background, and they are what keeps the node identifiable.
 *
 * The label colour is then derived from the fill the node actually ended up
 * with. It has to be written to the label's descendants as well as the
 * `.nodeLabel` span itself: mermaid renders the text inside a `<p>` that
 * carries its own colour, which beats an inline colour set on the parent.
 * That is exactly how an earlier version of this function came to compute a
 * correct label colour that never appeared on screen.
 */
function harmonizeDiagramColors(container: HTMLElement, dark: boolean) {
  for (const node of Array.from(container.querySelectorAll('.node, .cluster'))) {
    const shape = node.querySelector<SVGElement>('rect, polygon, circle, ellipse, path');
    const label = node.querySelector<HTMLElement>('.nodeLabel, .cluster-label');
    if (!shape) continue;

    const rgb = parseRgbColor(getComputedStyle(shape).fill);
    if (!rgb) continue;

    let luminance = relativeLuminance(...rgb);

    if (dark && luminance > LIGHT_FILL_LUMINANCE) {
      const [hue, saturation] = rgbToHsl(...rgb);
      const toned = hslToRgb(
        hue,
        Math.max(saturation, DARK_FILL_MIN_SATURATION),
        DARK_FILL_LIGHTNESS,
      );
      const [r, g, b] = toned;
      shape.style.setProperty(
        'fill',
        `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
        'important',
      );
      luminance = relativeLuminance(r, g, b);
    }

    if (!label) continue;

    const ink = luminance > LIGHT_FILL_LUMINANCE ? '#0a0a0a' : '#f7f7f6';
    label.style.setProperty('color', ink, 'important');
    for (const child of Array.from(label.querySelectorAll<HTMLElement>('*'))) {
      child.style.setProperty('color', ink, 'important');
    }
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
/**
 * Removes the bars of an `xychart-beta` whose value is 0.
 *
 * Mermaid starts the value axis a few pixels above the plot's floor, so a 0
 * still draws a short bar. That defeats the house way of highlighting one bar
 * of a set (see `plotColorPalette` in `buildThemeVariables`): split the set into
 * two `bar` series, with zeros where the other series has values. Each series
 * renders as `g.bar-plot-N`, N counting every `bar` and `line` in declaration
 * order, with one rect per value; the values are read back from the source.
 */
function hideZeroBars(container: HTMLElement, chart: string): void {
  if (!/^\s*(?:---[\s\S]*?---\s*)?xychart-beta\b/.test(chart)) return;

  const plots = [...chart.matchAll(/^\s*(bar|line)\b[^[\n]*\[([^\]]*)\]/gm)];
  plots.forEach(([, kind, list], index) => {
    if (kind !== 'bar') return;
    const values = (list ?? '').split(',').map((value) => Number(value.trim()));
    const rects = container.querySelectorAll(`g.bar-plot-${index} > rect`);
    rects.forEach((rect, position) => {
      if (values[position] === 0) rect.remove();
    });
  });
}

/**
 * `figure` is the diagram's position among the article's diagrams, counted by
 * `RichHtml`. Omit it to render without a caption bar.
 */
export function MermaidDiagram({ chart, figure }: { chart: string; figure?: number }) {
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

        const dark = isDarkTheme();

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          darkMode: dark,
          fontFamily: FONT_SANS,
          themeVariables: buildThemeVariables(),
        });

        const { svg } = await mermaid.render(diagramId, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          harmonizeDiagramColors(containerRef.current, dark);
          hideZeroBars(containerRef.current, chart);
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
    <figure className="mermaid-diagram mermaid-figure">
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
      {figure ? (
        <figcaption className="mermaid-figure-caption">
          <b>{`Fig. ${String(figure).padStart(2, '0')}`}</b>
        </figcaption>
      ) : null}
    </figure>
  );
}

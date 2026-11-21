import { ImageResponse } from 'next/og';

/** 1200x630 — the standard social-card ratio, which also reads as a wide hero. */
export const BANNER_SIZE = { width: 1200, height: 630 };

// Same path as src/components/brand-mark.tsx, src/app/icon.svg and
// src/app/opengraph-image.tsx. Kept as a literal for the same reason they do:
// next/og's Satori renderer needs a plain <svg> tree, not the shared React
// component, which relies on currentColor and Tailwind classes Satori never
// processes.
const MARK_PATH =
  'M20 6H32A14 14 0 0 1 46 20V32A14 14 0 0 1 32 46H20A14 14 0 0 1 6 32V20A14 14 0 0 1 20 6Z ' +
  'M32 18H46A14 14 0 0 1 58 32V46A14 14 0 0 1 46 58H32A14 14 0 0 1 18 46V32A14 14 0 0 1 32 18Z';

// The dark-theme tokens from src/app/globals.css. Hard-coded because the image
// is rasterized on the server with no document to read custom properties from —
// if those tokens move, these move with them.
const CANVAS = '#08090a';
const INK = '#f7f7f6';
const INK_MUTED = '#9a9a9a';
const ACCENT = '#fb923c';
const BORDER = '#2a2b2e';

/** FNV-1a. Any stable hash would do; this one is short and has no dependency. */
function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Title size, stepped by length so a long title wraps to at most three lines
 * instead of overflowing the canvas. Satori has no text measurement to lean
 * on, so this is done by character count rather than by measuring.
 */
function titleFontSize(title: string): number {
  if (title.length <= 28) return 84;
  if (title.length <= 48) return 68;
  if (title.length <= 72) return 56;
  return 46;
}

/**
 * Generates an article's banner.
 *
 * WHY GENERATED: every post's `cover` field is empty, and hand-sourcing
 * artwork for each article is work that does not scale with writing them. A
 * generated banner is there the moment an article exists.
 *
 * The design is deliberately restrained — it is a frame for a title, not an
 * illustration. The only motif is the site's own brand mark, blown up well
 * past its legible size, drawn as thin concentric outlines and bled off the
 * right edge at ~10% opacity, so it reads as texture rather than as a logo
 * sitting in the corner. Rotation, vertical offset and the number of rings
 * come from a hash of the slug, which makes every article's banner distinct
 * and every one of them stable: the same article always renders identically,
 * so caches and social previews never disagree.
 *
 * Varying the GEOMETRY and not the colour is the deliberate part. A per-article
 * hue would give more obvious variety and would also mean the site's one accent
 * colour stops meaning anything. The banners are meant to look like a set.
 */
export function renderArticleBanner({
  title,
  slug,
  kicker,
  readingMinutes,
}: {
  title: string;
  slug: string;
  kicker: string;
  readingMinutes?: number | null;
}): ImageResponse {
  const h = hashString(slug);
  const rotation = (h % 25) - 12;
  const ringCount = 2 + (h % 2);
  const offsetY = ((h >> 3) % 160) - 80;

  const rings = Array.from({ length: ringCount }, (_, index) => {
    const scale = 1 - index * 0.17;
    return {
      key: index,
      transform: `translate(32 32) scale(${scale.toFixed(3)}) translate(-32 -32)`,
      strokeWidth: 0.42 + index * 0.1,
      opacity: 1 - index * 0.25,
    };
  });

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        backgroundColor: CANVAS,
        color: INK,
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: rasterized to PNG by Satori — there is no accessibility tree inside the image, and the <img> that renders it carries the alt text. */}
      <svg
        width="820"
        height="820"
        viewBox="0 0 64 64"
        style={{ position: 'absolute', right: -210, top: -95 + offsetY, opacity: 0.1 }}
      >
        <g transform={`rotate(${rotation} 32 32)`}>
          {rings.map((ring) => (
            <path
              key={ring.key}
              d={MARK_PATH}
              fill="none"
              stroke={ACCENT}
              strokeWidth={ring.strokeWidth}
              strokeOpacity={ring.opacity}
              transform={ring.transform}
            />
          ))}
        </g>
      </svg>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: see above — rasterized, not part of any accessibility tree. */}
        <svg width="34" height="34" viewBox="0 0 64 64" fill={ACCENT}>
          <path fillRule="evenodd" d={MARK_PATH} />
        </svg>
        <div
          style={{
            marginLeft: 16,
            fontSize: 21,
            color: ACCENT,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {kicker}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: titleFontSize(title),
          fontWeight: 600,
          lineHeight: 1.12,
          letterSpacing: -1,
          maxWidth: 880,
        }}
      >
        {title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: INK_MUTED }}>
        <div style={{ display: 'flex', width: 64, height: 1, backgroundColor: BORDER }} />
        <div style={{ marginLeft: 20 }}>ssegning.com</div>
        {/* One interpolated string, not `{readingMinutes} min read`: Satori
            counts each text node as a child, so the two-node form needs an
            explicit `display` or it throws "Expected <div> to have explicit
            display: flex ... if it has more than one child node". */}
        {readingMinutes ? <div style={{ marginLeft: 20 }}>·</div> : null}
        {readingMinutes ? (
          <div style={{ marginLeft: 20 }}>{`${readingMinutes} min read`}</div>
        ) : null}
      </div>
    </div>,
    { ...BANNER_SIZE },
  );
}

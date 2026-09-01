import { ImageResponse } from 'next/og';

import { siteSetting as fallbackSiteSetting } from '@/content/fallback';
import { getSiteSetting } from '@/lib/strapi';

export const alt = 'Stephane Segning Lambou — Software & Platform Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same path as src/components/brand-mark.tsx and src/app/icon.svg — kept as
// a literal here because next/og's Satori renderer needs a plain <svg> tree,
// not the shared React component (which relies on currentColor + Tailwind
// classes Satori doesn't process).
const MARK_PATH =
  'M20 6H32A14 14 0 0 1 46 20V32A14 14 0 0 1 32 46H20A14 14 0 0 1 6 32V20A14 14 0 0 1 20 6Z ' +
  'M32 18H46A14 14 0 0 1 58 32V46A14 14 0 0 1 46 58H32A14 14 0 0 1 18 46V32A14 14 0 0 1 32 18Z';

export default async function Image() {
  const siteSetting = (await getSiteSetting()) ?? fallbackSiteSetting;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        backgroundColor: '#08090a',
        color: '#f7f7f6',
        fontFamily: 'sans-serif',
      }}
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: rasterized into a social-preview PNG by next/og's Satori renderer — there is no accessibility tree to label, and the adjacent site name text already carries the meaning. */}
      <svg width="56" height="56" viewBox="0 0 64 64" fill="#fb923c">
        <path fillRule="evenodd" d={MARK_PATH} />
      </svg>
      <div
        style={{
          marginTop: 20,
          fontSize: 28,
          color: '#fb923c',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {siteSetting.siteName}
      </div>
      <div
        style={{ marginTop: 24, fontSize: 56, fontWeight: 600, maxWidth: 900, lineHeight: 1.15 }}
      >
        {siteSetting.tagline ?? 'Cloud, Kubernetes & platform engineering.'}
      </div>
    </div>,
    { ...size },
  );
}

import { ImageResponse } from 'next/og';

import { siteSetting as fallbackSiteSetting } from '@/content/fallback';
import { getSiteSetting } from '@/lib/strapi';

export const alt = 'Stephane Segning Lambou — Software & Platform Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
      <div style={{ fontSize: 28, color: '#fb923c', letterSpacing: 2, textTransform: 'uppercase' }}>
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

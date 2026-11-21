import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // The commit this image was built from, inlined for app/sw-build.js: a new
  // value per deploy is what makes browsers install the new service worker.
  // CI passes GIT_SHA as a Docker build argument; local builds get 'dev'.
  env: { SW_BUILD_ID: process.env.GIT_SHA ?? 'dev' },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's3.ssegning.me' },
      { protocol: 'https', hostname: 'cms.ssegning.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // The browser checks sw.js (and the sw-build.js it imports) for a new
      // version on every visit; a cached copy would keep an old worker running
      // after a deploy.
      {
        source: '/:file(sw|sw-build).js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;

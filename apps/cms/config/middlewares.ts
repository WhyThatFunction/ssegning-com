export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 's3.ssegning.me'],
          'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 's3.ssegning.me'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://ssegning.com',
        'https://www.ssegning.com',
        'https://cms.ssegning.com',
        'http://localhost:3000',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  // Public /api reads are published-only (src/middlewares/published-only.ts).
  'global::published-only',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

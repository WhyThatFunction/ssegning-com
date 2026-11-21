export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  // The PATH the admin panel is mounted at — NOT an absolute URL.
  // strapi::public registers `GET /` -> ctx.redirect(config.get('admin.url', '/admin'))
  // (@strapi/core/dist/middlewares/public.js), so an absolute value here whose
  // path is `/` makes the site root redirect to itself forever. That is exactly
  // what STRAPI_ADMIN_BACKEND_URL (https://cms.ssegning.com) did here.
  // STRAPI_ADMIN_BACKEND_URL is a separate, BUILD-time variable the admin SPA
  // reads to know which backend to call; it is already passed to the container
  // in its own right and must not be reused as the panel's mount path.
  url: '/admin',
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});

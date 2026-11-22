/**
 * `GET /api/sitemap.xml`: the content sitemap, built from what is published
 * right now. Public by design: it lists only published URLs, the same ones
 * the site itself links to. The website serves it on its own domain at
 * `/sitemap-content.xml` (apps/web/src/app/sitemap-content.xml/route.ts),
 * and robots.txt points crawlers there.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/sitemap.xml',
      handler: 'sitemap.index',
      config: { auth: false },
    },
  ],
};

import { buildContentSitemap } from '../services/sitemap';

/** The slice of Koa's context this controller uses. */
interface Context {
  status: number;
  type: string;
  body: unknown;
  set(field: string, value: string): void;
}

export default {
  async index(ctx: Context) {
    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      // Without the site's origin every <loc> would be wrong; say so rather
      // than publish a sitemap of someone else's URLs.
      ctx.status = 503;
      ctx.body = 'SITE_URL is not configured';
      return;
    }

    ctx.type = 'application/xml; charset=utf-8';
    ctx.set('Cache-Control', 'public, max-age=300');
    ctx.body = await buildContentSitemap(strapi, {
      siteUrl,
      cmsUrl: process.env.PUBLIC_URL ?? '',
    });
  },
};

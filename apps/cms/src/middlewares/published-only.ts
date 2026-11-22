/**
 * The public content API serves published content only.
 *
 * Strapi 5's content API honours a `status` query parameter, and with the
 * public role's `find` permission (granted in src/bootstrap/permissions.ts so
 * the website can read anonymously) `GET /api/posts?status=draft` returned
 * every draft to anyone: unpublished articles and unpublished edits alike.
 * Nothing legitimate reads drafts through `/api`: the website reads published
 * content, the admin panel reads drafts through its own `/content-manager`
 * routes, and the bootstrap uses the Document Service directly.
 *
 * So every `/api` request is answered as `status=published`, whatever it
 * asked for. This is the outer layer; each content type's service also forces
 * published content (src/utils/published-only.ts), which holds however the
 * URL is spelled. Runs after `strapi::query`, whose setter re-serialises the
 * object, so the controllers see the forced value.
 */
interface Context {
  path: string;
  query: Record<string, unknown>;
}

export default () => async (ctx: Context, next: () => Promise<void>) => {
  // Case-insensitive: Strapi's router matches `/API/posts` too.
  if (
    /^\/api\//i.test(ctx.path) &&
    ctx.query.status !== undefined &&
    ctx.query.status !== 'published'
  ) {
    ctx.query = { ...ctx.query, status: 'published' };
  }
  await next();
};

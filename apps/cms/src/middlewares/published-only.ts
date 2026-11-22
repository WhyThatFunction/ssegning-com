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
 * asked for. Runs after `strapi::query`, whose setter re-serialises the
 * object, so the controllers see the forced value.
 */
interface Context {
  path: string;
  query: Record<string, unknown>;
}

export default () => async (ctx: Context, next: () => Promise<void>) => {
  if (ctx.path.startsWith('/api/') && 'status' in ctx.query && ctx.query.status !== 'published') {
    ctx.query = { ...ctx.query, status: 'published' };
  }
  await next();
};

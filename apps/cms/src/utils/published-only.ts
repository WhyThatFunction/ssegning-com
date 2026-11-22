/**
 * Service extension that makes a content-type's core service read published
 * content only, whatever `status` the caller passes.
 *
 * Strapi's core service builds its query as `{ status: 'published', ...params }`,
 * so a `?status=draft` from the public content API overrode the default and
 * returned drafts to anonymous callers. Putting `status` last makes published
 * win. These services are reached only through the content API (`/api/...`):
 * the admin panel reads drafts through the Document Service, and so does the
 * bootstrap, so neither is affected.
 *
 * This is the layer that holds however the URL is spelled; the
 * `global::published-only` middleware (src/middlewares/published-only.ts) is
 * a second, independent one.
 */
export const publishedOnly = () => ({
  getFetchParams(params: Record<string, unknown> = {}) {
    return { ...params, status: 'published' as const };
  },
});

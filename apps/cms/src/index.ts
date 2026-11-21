import type { Core } from '@strapi/strapi';
import { createSuperAdminIfMissing } from './bootstrap/admin-user';
import { publishBundledArticles } from './bootstrap/articles';
import { migrateArticleBodies } from './bootstrap/migrate-article-bodies';
import { setPublicPermissions } from './bootstrap/permissions';
import { seed } from './bootstrap/seed';
import { notify } from './lib/apprise';

// Every content-type the Users & Permissions public role should be able to
// read anonymously — see CONTRACT.md "Auth model". There is no Strapi API
// token in this project.
const PUBLIC_CONTENT_TYPES = [
  'site-setting',
  'home-page',
  'about-page',
  'contact-page',
  'legal-page',
  'service',
  'project',
  'post',
];

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Wrapped so every boot fires an Apprise notification either way — a
    // "success" heartbeat lets us confirm a deploy actually came up, and a
    // "failure" alert on a bootstrap error means we hear about it without
    // having to go read pod logs. The error is always re-thrown so Strapi
    // still fails loudly; this is an alerting side channel, not a recovery
    // path.
    try {
      await createSuperAdminIfMissing(strapi);
      await setPublicPermissions(strapi, PUBLIC_CONTENT_TYPES);
      await seed(strapi);
      await publishBundledArticles(strapi);
      // One-time Markdown -> Tiptap HTML cutover for posts created before
      // `post.body` switched custom field types (see
      // bootstrap/migrate-article-bodies.ts). Runs after
      // publishBundledArticles so any post it just created (already HTML)
      // is an idempotent no-op here, not a double conversion.
      await migrateArticleBodies(strapi);

      await notify({
        strapi,
        type: 'success',
        title: 'ssegning-com CMS booted',
        // `info.*` is Strapi's view of apps/cms/package.json, so `info.version`
        // is the CMS app version. NOT `info.strapi` — that key holds the
        // `{ uuid }` object, which stringifies to "[object Object]".
        body: `CMS bootstrapped successfully at ${process.env.PUBLIC_URL || 'unknown URL'} (cms v${strapi.config.get('info.version', 'unknown')}). Steps run: super admin check, public permissions, seed, article publishing, article body migration.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await notify({
        strapi,
        type: 'failure',
        title: 'ssegning-com CMS bootstrap failed',
        body: `Bootstrap threw: ${message}`,
      });

      throw error;
    }
  },
};

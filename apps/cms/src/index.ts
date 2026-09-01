import type { Core } from '@strapi/strapi';
import { createSuperAdminIfMissing } from './bootstrap/admin-user';
import { publishBundledArticles } from './bootstrap/articles';
import { setPublicPermissions } from './bootstrap/permissions';
import { seed } from './bootstrap/seed';

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
    await createSuperAdminIfMissing(strapi);
    await setPublicPermissions(strapi, PUBLIC_CONTENT_TYPES);
    await seed(strapi);
    await publishBundledArticles(strapi);
  },
};

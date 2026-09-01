import type { Core } from '@strapi/strapi';

const PUBLIC_ACTIONS = ['find', 'findOne'] as const;

/**
 * Grants the Users & Permissions "public" role `find` + `findOne` on every
 * given API content type, so apps/web can read the REST API anonymously
 * (there is no Strapi API token in this project — see CONTRACT.md).
 *
 * Idempotent: safe to run on every boot, never throws if a permission
 * already exists or if the public role cannot be found yet.
 */
export async function setPublicPermissions(strapi: Core.Strapi, apiNames: string[]): Promise<void> {
  try {
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) {
      strapi.log.warn('[bootstrap/permissions] public role not found yet, skipping grants');
      return;
    }

    for (const apiName of apiNames) {
      for (const action of PUBLIC_ACTIONS) {
        const actionId = `api::${apiName}.${apiName}.${action}`;

        try {
          const existing = await strapi.query('plugin::users-permissions.permission').findOne({
            where: { action: actionId, role: publicRole.id },
          });

          if (existing) {
            continue;
          }

          await strapi.query('plugin::users-permissions.permission').create({
            data: { action: actionId, role: publicRole.id },
          });

          strapi.log.info(`[bootstrap/permissions] granted public.${actionId}`);
        } catch (error) {
          strapi.log.warn(
            `[bootstrap/permissions] failed to grant ${actionId}: ${(error as Error).message}`,
          );
        }
      }
    }
  } catch (error) {
    strapi.log.warn(`[bootstrap/permissions] setup failed: ${(error as Error).message}`);
  }
}

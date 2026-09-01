import type { Core } from '@strapi/strapi';

/**
 * Creates a Strapi super admin from ADMIN_EMAIL / ADMIN_PASSWORD /
 * ADMIN_FIRSTNAME / ADMIN_LASTNAME, but only when there are zero admin
 * users yet. This closes the open-registration window that otherwise lets
 * the first visitor to https://cms.ssegning.com/admin claim the instance.
 *
 * Skips silently (with a log line, and never logs the password) when any
 * of the four env vars is unset — expected in local dev, where the normal
 * /admin registration flow is used instead.
 */
export async function createSuperAdminIfMissing(strapi: Core.Strapi): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstname = process.env.ADMIN_FIRSTNAME;
  const lastname = process.env.ADMIN_LASTNAME;

  if (!email || !password || !firstname || !lastname) {
    strapi.log.info(
      '[bootstrap/admin-user] ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_FIRSTNAME/ADMIN_LASTNAME not fully set, skipping super admin bootstrap (expected in local dev)',
    );
    return;
  }

  try {
    const adminCount = await strapi.db.query('admin::user').count();

    if (adminCount > 0) {
      strapi.log.info(
        '[bootstrap/admin-user] admin users already exist, skipping super admin bootstrap',
      );
      return;
    }

    const superAdminRole = await strapi.service('admin::role').getSuperAdmin();

    if (!superAdminRole) {
      strapi.log.warn(
        '[bootstrap/admin-user] super admin role not found, skipping super admin bootstrap',
      );
      return;
    }

    await strapi.service('admin::user').create({
      email,
      password,
      firstname,
      lastname,
      isActive: true,
      roles: [superAdminRole.id],
    });

    strapi.log.info(`[bootstrap/admin-user] created super admin user (${email})`);
  } catch (error) {
    strapi.log.error(
      `[bootstrap/admin-user] failed to create super admin: ${(error as Error).message}`,
    );
  }
}

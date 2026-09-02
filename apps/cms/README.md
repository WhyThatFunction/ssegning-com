# @ssegning/cms

Strapi 5 CMS backing [ssegning.com](https://ssegning.com). Postgres database,
S3-compatible (MinIO) media storage, and a public, tokenless REST API — see
`CONTRACT.md` at the repo root for the full content model and auth model.

## Local development

```bash
cp .env.example .env
# fill in APP_KEYS (4 comma-separated values), the various secrets/salts,
# and DATABASE_* for a local Postgres instance.

pnpm install
pnpm --filter @ssegning/cms develop
```

On first boot, `bootstrap()` (see `src/index.ts`):

1. Optionally creates a super admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` /
   `ADMIN_FIRSTNAME` / `ADMIN_LASTNAME`, but only when no admin user exists
   yet. Leave these unset locally to use the normal `/admin` registration
   screen instead.
2. Grants the Users & Permissions **public** role `find` + `findOne` on
   every content type, so `apps/web` can read the REST API anonymously.
3. Seeds realistic starter content (site settings, pages, services, case
   studies) — only if no `site-setting` entry exists yet (`src/bootstrap/seed.ts`).
   This step does **not** create journal posts — see the next step.
4. Publishes the 12 bundled Markdown articles under
   `src/bootstrap/articles/` into the `post` collection
   (`src/bootstrap/articles.ts`), one per file, in a fixed release order —
   but only for slugs that don't already exist. It never updates an
   existing post, so editing a published post's title/body/excerpt in the
   Strapi admin is never reverted by a later restart. Because Strapi 5's
   Document Service always stamps `publishedAt` with "now" on `create()`,
   the importer backdates each post's release date with a follow-up
   `strapi.db.query('api::post.post').update(...)` call (the low-level
   query layer has no such override) so `GET /api/posts?sort=publishedAt:desc`
   reproduces the intended reading order.

## Scripts

- `pnpm develop` — start Strapi in development mode (admin panel autoreload).
- `pnpm build` — `strapi build` **followed by**
  `node scripts/copy-bootstrap-assets.js`. That second step matters:
  `strapi build` only transpiles `src/**/*.ts` into `dist/`, so without it
  the bundled article Markdown `src/bootstrap/articles.ts` reads at runtime
  via `readFileSync` is silently missing from `dist/`, and the production
  image (which ships only `dist/`, never `src/`) `ENOENT`s reading a bundled
  article at boot.
- `pnpm start` — run the built app in production mode.
- `pnpm strapi -- <command>` — run any Strapi CLI command.

## Environment variables

See `.env.example` for the full list. Summary:

| Variable | Purpose |
| --- | --- |
| `HOST`, `PORT` | Server bind address. |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` | Strapi secrets — generate fresh random values per environment. |
| `DATABASE_CLIENT`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_SSL` | Postgres connection. |
| `PUBLIC_URL`, `STRAPI_ADMIN_BACKEND_URL` | Public-facing URL of this instance. |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE` | MinIO/S3 upload provider (path-style). |
| `WEB_REVALIDATE_URL`, `WEB_REVALIDATE_SECRET` | Used by `apps/web` for on-demand ISR revalidation (not consumed by the CMS itself, kept here for reference). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRSTNAME`, `ADMIN_LASTNAME` | One-time super admin bootstrap credentials — only used when zero admin users exist. |

## Health check

`GET /_health` — Strapi's built-in health endpoint, returns `204`.

## Auth model

There is **no** Strapi API token. `apps/web` reads the REST API anonymously;
the public role's `find`/`findOne` permissions are granted automatically on
every boot (see `src/bootstrap/permissions.ts`).

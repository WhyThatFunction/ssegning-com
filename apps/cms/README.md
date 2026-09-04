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

The whole sequence is wrapped in a try/catch that fires an Apprise
notification either way (`src/lib/apprise.ts`) — a `success` heartbeat once
all four steps complete, or a `failure` alert with the error message if any
step throws, after which the error is re-thrown so Strapi still fails
loudly. See "Mail and alerting paths" below.

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
| `SMTP_HOST`, `SMTP_PORT` | Address of the in-cluster postfix relay (`mail` service, `mail-system` namespace), port 587 (STARTTLS submission). |
| `SMTP_SASL_USERS` | Raw `user:password` value of the relay's own `smtpd_sasl_users` property (from AWS Secrets Manager in deploy). Parsed tolerantly by `src/lib/smtp-credentials.ts`. |
| `SMTP_SASL_REALM` | Realm the parsed SASL username is qualified with (`user` -> `user@realm`) before authenticating, by `qualifySaslUser` in `src/lib/smtp-credentials.ts`. Required against the production relay — see that function's doc comment for the exact `smtpd_sasl_local_domain` mechanism. Empty/unset leaves the username unqualified. |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | Whether to verify the relay's TLS cert; defaults to `false` because it presents a self-signed one and the hop stays inside the cluster network. |
| `EMAIL_DEFAULT_FROM`, `EMAIL_DEFAULT_REPLY_TO` | Default `from`/`reply-to` for outbound mail. The relay enforces `ALLOWED_SENDER_DOMAINS`, so `EMAIL_DEFAULT_FROM` must stay on a permitted domain. |
| `APPRISE_URL` | Base URL of the in-cluster Apprise instance (`notification-system` namespace) used for deploy/bootstrap alerts. Unset disables alerting (local dev). |
| `APPRISE_ALERT_TO` | Recipient address used when deriving the default `mailto://` alert URL from the `SMTP_*` settings above. |
| `APPRISE_ALERT_URLS` | Optional override: arbitrary Apprise URL(s) (Slack, Telegram, etc.) used verbatim instead of the derived `mailto://` URL — the swap point for moving alerts off email. |

Leaving the `SMTP_*` and `APPRISE_*` vars unset in local dev is expected: it
disables outbound mail and bootstrap alerting without affecting anything
else.

### Mail and alerting paths

Outbound email (`config/plugins.ts`, `@strapi/provider-email-nodemailer`)
goes Strapi → the in-cluster postfix relay on port 587 (STARTTLS,
SASL-authenticated) → postfix's own upstream smart host. Deploy/bootstrap
alerts (`src/lib/apprise.ts`) go from `bootstrap()` in `src/index.ts` to the
in-cluster Apprise instance's `/notify` endpoint, which is stateless and
takes its target URL(s) — by default a `mailto://` URL derived from the
same SMTP credentials, or `APPRISE_ALERT_URLS` if set — on every call.

## Rich Text (Tiptap) field

`@notum-cz/strapi-plugin-tiptap-editor` (MIT, free, no licence key) is
installed and registered in `config/plugins.ts`. It adds a **new** custom
field type — "Rich Text (Tiptap)" — to the Content-Type Builder. It does
**not** replace the built-in `richtext` type: `post.body` (see
`src/api/post/content-types/post/schema.json`) is untouched, and none of
the bundled bootstrap articles are migrated or affected.

Two presets are defined (`config/plugins.ts`), chosen to match what the
bundled Markdown articles under `src/bootstrap/articles/` actually use
(headings, bold/italic, inline code, fenced/mermaid code blocks,
blockquotes, lists, links, tables):

- `article` — the full feature set for long-form body copy.
- `minimal` — bold/italic/link only, for short-form copy like excerpts or
  captions.

To opt a field into it: in the Strapi admin, open **Content-Type
Builder** → add or edit a field → choose **Rich Text (Tiptap)** as the
type → in **Advanced Settings**, pick a preset from the **Editor Preset**
dropdown → save the content type. Existing fields are unaffected unless
someone deliberately changes their type.

### Peer dependency caveat

The plugin's `peerDependencies` pin `@strapi/strapi` to the **exact**
string `5.39.0`. This repo runs `@strapi/strapi` `^5.52.2`. Upstream
tracks this as [issue #27](https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues/27)
with an open (unmerged) fix in
[PR #34](https://github.com/notum-cz/strapi-plugin-tiptap-editor/pull/34).

This repo does not set `strict-peer-dependencies=true`, so pnpm only
**warns** — it does not fail the install — and `pnpm --filter
@ssegning/cms build` succeeds regardless. Run `pnpm peers check` from the
repo root to see the current list; besides the `@strapi/strapi` mismatch,
expect warnings for `react-router-dom` (6.30.3 wanted vs. 6.30.6
installed) and `styled-components` (6.3.11 wanted vs. 6.5.3 installed),
and for `react` (19 wanted vs. 18.3.1 installed) via the plugin's own
`react-intl@8.1.3` dependency. None of these are enforced, but a future
`@strapi/strapi` major/minor bump should be re-checked against whatever
version the plugin has moved its peer pin to by then — if it ever
diverges enough to actually break the admin build, watch #27/#34 for a
merged fix or pin `@strapi/strapi` back down as a stopgap.

## Health check

`GET /_health` — Strapi's built-in health endpoint, returns `204`.

## Auth model

There is **no** Strapi API token. `apps/web` reads the REST API anonymously;
the public role's `find`/`findOne` permissions are granted automatically on
every boot (see `src/bootstrap/permissions.ts`).

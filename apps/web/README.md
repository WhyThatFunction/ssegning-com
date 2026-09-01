# @ssegning/web

The public marketing website for [ssegning.com](https://ssegning.com) — a
solo software & platform engineering consultancy. Next.js 16 (App Router),
React 19, TypeScript, Tailwind CSS v4.

Content (home page, services, case studies, journal posts, about/contact/
legal copy) is served by the sibling `apps/cms` Strapi instance. This app
reads it anonymously over the public REST API — there is no Strapi API
token — and renders fully even when Strapi is unreachable or empty, falling
back to the hand-written copy in `src/content/fallback.ts`.

See `DESIGN.md` in this directory for the design research, reference lock,
and token decisions behind the UI.

## Running locally

```bash
pnpm install
pnpm --filter @ssegning/web dev
```

Requires Node >=22. Copy `.env.example` to `.env.local` and point
`STRAPI_URL` at a running Strapi instance (see `apps/cms`), or leave it
pointed at nothing to develop entirely against the fallback content.

## Scripts

- `pnpm --filter @ssegning/web dev` — start the Next.js dev server.
- `pnpm --filter @ssegning/web build` — production build (`output: 'standalone'`).
- `pnpm --filter @ssegning/web start` — run the production build.
- `pnpm --filter @ssegning/web lint` — Biome check.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `STRAPI_URL` | yes (server-side) | Base URL of the Strapi CMS, e.g. `http://ssegning-cms:1337` in-cluster. Every fetch fails soft to `null`/`[]` if this is unset, unreachable, or times out (8s), so the site still renders. |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical public origin, e.g. `https://ssegning.com`. Used for metadata, `sitemap.xml`, and `robots.txt`. |
| `REVALIDATE_SECRET` | yes | Shared secret checked against the `x-revalidate-secret` header on `POST /api/revalidate`. Must equal the CMS's `WEB_REVALIDATE_SECRET`. |

See `.env.example` for a ready-to-copy template.

## Resilience

`src/lib/strapi.ts` is the only module allowed to talk to Strapi. Every
helper there wraps its `fetch` in try/catch and returns `null` (single
content types) or `[]` (collections) on any failure — network error,
non-2xx status, malformed JSON, or the 8-second timeout. Pages combine that
result with `src/content/fallback.ts` (`data ?? fallback`), so a cold or
down CMS renders full pages with realistic default copy instead of a 500 or
a blank screen.

`GET /api/healthz` never touches Strapi — it only reports this app's own
liveness.

## Notes on the font choice

The brief allows either `next/font/google` (self-hosted at build) or a
system font stack, and asks that the choice be justified. This app uses a
system font stack (`-apple-system, "Segoe UI", Inter, Roboto, "Helvetica
Neue", Arial, sans-serif` for UI text; a matching system monospace stack for
numerals/labels/code) instead of `next/font/google`, because this repo's
image is built in CI via Docker and a Google Fonts fetch at build time is an
avoidable network dependency for a build step that should be able to run
offline. The chosen stack renders geometry close enough to Inter (the font
used by this site's primary design references) on every modern OS that the
visual difference is negligible.

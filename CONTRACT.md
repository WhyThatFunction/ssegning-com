# ssegning.com — build contract (authoritative, do not change)

Monorepo `WhyThatFunction/ssegning-com`. pnpm workspaces. Node 22. TypeScript everywhere.
Files kebab-case. Biome for lint/format (NOT eslint/prettier). React components PascalCase.

## Layout
- `apps/cms`  — Strapi 5 (`@strapi/strapi@^5.52.2`), TypeScript, Postgres, S3 uploads.
- `apps/web`  — Next.js 16 (`next@^16.3.4`, react 19), App Router, Tailwind CSS v4.
- `deploy/chart` — Helm chart deployed by ArgoCD onto a Talos k8s cluster.
- `.github/workflows` — CI.

## Images (GHCR, public, linux/amd64)
- `ghcr.io/whythatfunction/ssegning-com/cms`
- `ghcr.io/whythatfunction/ssegning-com/web`
Tags pushed: `main`, `sha-<7charsha>`. Deployment pins `sha-<...>`.

## Networking / hostnames (already resolving via Cloudflare proxy -> home cluster)
- `https://ssegning.com`      -> web        (apex, canonical)
- `https://www.ssegning.com`  -> 301 to apex
- `https://god.ssegning.com`  -> 301 to `https://ssegning.com`
- `https://apps.ssegning.com` -> 301 to `https://ssegning.com`
- `https://cms.ssegning.com`  -> Strapi (admin + REST API)

## CMS runtime env (Strapi)
HOST=0.0.0.0
PORT=1337
APP_KEYS                      (comma-separated, 4 keys)
API_TOKEN_SALT
ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT
JWT_SECRET
ENCRYPTION_KEY
DATABASE_CLIENT=postgres
DATABASE_HOST, DATABASE_PORT=5432, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD
DATABASE_SSL=false
PUBLIC_URL=https://cms.ssegning.com
STRAPI_ADMIN_BACKEND_URL=https://cms.ssegning.com
S3_ENDPOINT=https://s3.ssegning.me     (MinIO, path-style, force path style = true)
S3_REGION=us-east-1
S3_BUCKET=ssegning-uploads
S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
S3_PUBLIC_BASE=https://s3.ssegning.me/ssegning-uploads
WEB_REVALIDATE_URL=http://ssegning-web:3000/api/revalidate
WEB_REVALIDATE_SECRET

## WEB runtime env (Next.js)
STRAPI_URL=http://ssegning-cms:1337      (server-side, in-cluster)
NEXT_PUBLIC_SITE_URL=https://ssegning.com
REVALIDATE_SECRET                        (must equal WEB_REVALIDATE_SECRET)

## Auth model — IMPORTANT
There is NO Strapi API token. The CMS grants the Users&Permissions `public`
role `find`/`findOne` on every content type from a bootstrap script, so the web
app reads the REST API anonymously. Never require a token in apps/web.

## Content model (Strapi 5 content-types, API IDs exactly as written)

Single types:
- `site-setting`   (api::site-setting.site-setting)
    siteName: string (req)
    tagline: string
    logo: media (single image)
    navLinks: component `shared.link` repeatable
    footerNote: text
    metaDescription: text
    socials: component `shared.social` repeatable
- `home-page`      (api::home-page.home-page)
    heroEyebrow: string
    heroHeadline: string (req)
    heroSubline: text
    primaryCta: component `shared.link`
    secondaryCta: component `shared.link`
    heroImage: media (single image)
    metrics: component `shared.metric` repeatable
    introTitle: string
    introBody: richtext
    seo: component `shared.seo`
- `about-page`     (api::about-page.about-page)
    name: string (req)
    role: string
    portrait: media (single image)
    bio: richtext
    highlights: component `shared.metric` repeatable
    seo: component `shared.seo`
- `contact-page`   (api::contact-page.contact-page)
    headline: string
    body: richtext
    email: email
    phone: string
    location: string
    bookingUrl: string
    seo: component `shared.seo`
- `legal-page`     (api::legal-page.legal-page)
    imprint: richtext
    privacy: richtext
    terms: richtext

Collection types (all have `slug` uid on title, draft&publish ON):
- `service`  (api::service.service)
    title: string (req), slug: uid(title) (req), summary: text,
    body: richtext, icon: string (lucide icon name), order: integer,
    deliverables: component `shared.bullet` repeatable
- `project`  (api::project.project)   -- case studies
    title: string (req), slug: uid(title) (req), client: string, year: integer,
    summary: text, body: richtext, cover: media (single image),
    gallery: media (multiple), tags: json, outcome: text, url: string, order: integer,
    seo: component `shared.seo`
- `post`     (api::post.post)         -- journal
    title: string (req), slug: uid(title) (req), excerpt: text, body: richtext,
    cover: media (single image), readingMinutes: integer,
    seo: component `shared.seo`

Components:
- `shared.link`   : label(string,req), href(string,req), external(boolean)
- `shared.metric` : label(string,req), value(string,req), detail(string)
- `shared.social` : platform(enum: github,linkedin,x,mastodon,email,rss), url(string,req)
- `shared.bullet` : text(string,req)
- `shared.seo`    : metaTitle(string), metaDescription(text), shareImage(media single image)

## Seed
`apps/cms/src/bootstrap/seed.ts` runs on `bootstrap()` ONLY when the DB has no
`site-setting` entry. It creates published, realistic content for a solo
software/platform-engineering consultancy run by Stephane Segning Lambou
(Cloud/Kubernetes/Rust/TypeScript, based in Germany): site settings, home page,
about page, contact page, legal page, 4 services, 3 projects, 2 journal posts.
Content must be real prose, never lorem ipsum. Always idempotent.

## REST contract used by apps/web
GET {STRAPI_URL}/api/site-setting?populate=*
GET {STRAPI_URL}/api/home-page?populate=*
GET {STRAPI_URL}/api/about-page?populate=*
GET {STRAPI_URL}/api/contact-page?populate=*
GET {STRAPI_URL}/api/legal-page
GET {STRAPI_URL}/api/services?sort=order:asc&populate=*
GET {STRAPI_URL}/api/projects?sort=order:asc&populate=*
GET {STRAPI_URL}/api/projects?filters[slug][$eq]=<slug>&populate=*
GET {STRAPI_URL}/api/posts?sort=publishedAt:desc&populate=*
GET {STRAPI_URL}/api/posts?filters[slug][$eq]=<slug>&populate=*
Strapi 5 flattens: response is { data: {...fields}, meta } — no `attributes` wrapper.

## Health endpoints
- cms: `GET /_health` (Strapi built-in, returns 204)
- web: `GET /api/healthz` -> 200 `{"status":"ok"}` (must NOT touch Strapi)

## Resilience requirement
apps/web MUST render every page even when Strapi is unreachable or empty:
every fetch helper returns `null`/`[]` on error and pages fall back to
hard-coded default copy. A cold cluster must never show a 500.

## ADDENDUM 1 — Strapi super-admin bootstrap (added after initial dispatch)

Extra CMS env vars (all sourced from AWS Secrets Manager `ssegning/prod/env`):

ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_FIRSTNAME
ADMIN_LASTNAME

`apps/cms` bootstrap MUST create a Strapi **super admin** with these
credentials when (and only when) `strapi.db.query('admin::user').count()` is 0.
This closes the open-registration window that otherwise lets the first visitor
to `https://cms.ssegning.com/admin` claim the instance. Use the admin services
(`strapi.service('admin::user').create({ email, password, firstname, lastname,
isActive: true, roles: [<super admin role id>] })` — get the role via
`strapi.service('admin::role').getSuperAdmin()`). Skip silently, with a log
line, if any of the four env vars is unset (local dev). Never log the password.

Corresponding chart change: the `ssegning-cms-secrets` ExternalSecret gains
four more keys — `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRSTNAME`,
`ADMIN_LASTNAME` — from remote properties `admin_email`, `admin_password`,
`admin_firstname`, `admin_lastname`; and the CMS Deployment injects them.

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
| `GISCUS_REPO` | no | `owner/repo` hosting the comment Discussions, e.g. `WhyThatFunction/ssegning-com`. Read server-side in `app/journal/[slug]/page.tsx`. |
| `GISCUS_REPO_ID` | no | That repo's GraphQL node ID. |
| `GISCUS_CATEGORY` | no | Discussion category name to post comments into, e.g. `Announcements`. |
| `GISCUS_CATEGORY_ID` | no | That category's GraphQL node ID. |

The four giscus variables are deliberately **not** `NEXT_PUBLIC_*` even
though giscus's own config values aren't secret — see "Comments" below for
why that distinction matters a lot in this app's build/deploy split. Leave
all four unset to build and run with comments disabled.

See `.env.example` for a ready-to-copy template.

## Resilience

`src/lib/strapi.ts` is the only module allowed to talk to Strapi. Every
helper there wraps its `fetch` in try/catch and returns `null` (single
content types) or `[]` (collections) on any failure — network error,
non-2xx status, malformed JSON, or the 8-second timeout. Pages combine that
result with `src/content/fallback.ts` (`data ?? fallback`), so a cold or
down CMS renders full pages with realistic default copy instead of a 500 or
a blank screen.

**Every route that reads CMS content also declares its own
`export const revalidate = 60`** (see `app/page.tsx`, `app/journal/page.tsx`,
`app/journal/[slug]/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`,
`app/work/page.tsx`, `app/work/[slug]/page.tsx`, `app/legal/*/page.tsx`,
`sitemap.ts`). This is not redundant with the `revalidate`/`tags` options
already passed to `fetch` in `strapi.ts` — it's what stops the Docker build
from baking a route as **permanently static**. The production image is
built in CI, which has no Strapi to talk to, so every fetch during that
build resolves via the fail-soft path above with nothing revalidatable
recorded. Without the route-level `revalidate` export, Next has no other
signal and treats the route as static forever, serving fallback copy
indefinitely even once the CMS is reachable in the running cluster. If you
add a new page that reads `strapi.ts`, it needs this export too.

`GET /api/healthz` never touches Strapi — it only reports this app's own
liveness.

## Content rendering

Two renderers cover all CMS body/prose fields, and they are not
interchangeable:

- **`src/components/markdown.tsx` (`<Markdown>`)** — for every field that is
  still Strapi's built-in `richtext` Markdown: `home.introBody`,
  `about.bio`, `contact.body`, `legal.imprint`/`privacy`/`terms`, and
  `project.body`/`service.body`. Built on `react-markdown` + `remark-gfm`,
  which parses Markdown into an AST and builds React elements from it — no
  raw-HTML passthrough, so no sanitizer is needed for this path.
- **`src/components/rich-html.tsx` (`<RichHtml>`)** — for `post.body` only.
  Journal articles moved from Markdown to Tiptap-authored HTML (see the root
  `README.md`'s "Content model" section for the CMS side of that
  migration); `<RichHtml>` sanitizes that HTML with `sanitize-html` before
  parsing it with `html-react-parser`, since an HTML string has no structural
  guarantee against a `<script>` tag or a `javascript:` link the way a
  Markdown AST does — and Tiptap's own link mark lets an editor type an
  arbitrary `href`, so that's a real editing-surface concern, not a
  hypothetical one.

Both renderers detect a mermaid diagram the same way — a fenced/coded block
that is exactly `<pre><code class="language-mermaid">…</code></pre>` — and
swap it for `src/components/mermaid-diagram.tsx`'s `<MermaidDiagram>`
instead of a plain code block. `<RichHtml>` additionally decodes the code
block's text through the HTML parser (not a raw-string regex), since
`marked` emits `-->` as `--&gt;` inside code and mermaid needs the literal
arrow to parse the diagram.

If you add a new Tiptap-backed (HTML) field, render it with `<RichHtml>`,
not `<Markdown>` — the latter would render raw HTML tags as literal text.

## Comments

Journal articles have a comment thread powered by
[giscus](https://giscus.app) — comments are stored as GitHub Discussions on
the `WhyThatFunction/ssegning-com` repo, and readers sign in with their
existing GitHub account. There is no backend, no database, and no PII
stored by this app.

**Why the four `GISCUS_*` env vars are plain vars, not `NEXT_PUBLIC_*` —
read this before renaming them.** `src/components/comments.tsx` is a client
component, but it takes its config as **props**, not `process.env` reads.
`app/journal/[slug]/page.tsx` (a Server Component) reads the four `GISCUS_*`
vars from `process.env` at request time and passes them down. This matters
because of how this app is built and deployed: the Docker image is built in
CI, which has no giscus config, and the real values are only supplied later
as plain env vars on the Kubernetes Deployment. A `NEXT_PUBLIC_*` variable
gets inlined into the client JS bundle at *build* time — if these were
`NEXT_PUBLIC_GISCUS_*`, they'd be baked in as `undefined` forever and
comments would silently never render in production, no matter what the
cluster's Deployment sets. Plain vars read server-side pick up a Deployment
env change on the next pod restart, no rebuild required. **Do not rename
these back to `NEXT_PUBLIC_GISCUS_*`** — that reintroduces exactly this bug.

`comments.tsx` renders nothing at all (no console error, no layout gap)
when any of the four props is missing, which is the default state of a
fresh checkout or a cluster without the env vars set.

Discussions are already enabled on the repo and the category already
exists (see the real values in `.env.example` / the table above), so
**the only remaining step needs a human with admin rights on the repo**:

1. **(human)** Install the **[giscus GitHub App](https://github.com/apps/giscus)**
   on `WhyThatFunction/ssegning-com`. Without this, giscus cannot open
   Discussions on the repo's behalf, and the widget shows a
   "giscus is not installed on this repository" error instead of the
   comment thread.
2. Set the four `GISCUS_*` values from `.env.example` on the target
   environment (`.env.local` for local dev, the Deployment's env for prod)
   and (re)start the app — no rebuild needed for a prod env-var change,
   since these are read server-side at request time, not baked in at build
   time.

If a repo, or its category, ever needs to change: open
[giscus.app](https://giscus.app), enter the repo, and once it detects
Discussions are enabled and the giscus app is installed it reveals a
generated `<script>` snippet — copy `data-repo`/`data-repo-id`/
`data-category`/`data-category-id` out of that into `GISCUS_REPO`/
`GISCUS_REPO_ID`/`GISCUS_CATEGORY`/`GISCUS_CATEGORY_ID`. The category
should stay an **Announcement**-type category (locked, so only maintainers
can start a new discussion — giscus's own recommendation, since it means
every thread is one giscus itself created for an article, not one a
visitor opened directly).

Theme: the widget follows the site's light/dark theme (see
`src/components/theme-toggle.tsx`) on load, and is re-synced live via
giscus's `postMessage` API whenever the visitor toggles the theme or their
OS-level scheme changes — the giscus iframe does not otherwise notice either
kind of change on its own.

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

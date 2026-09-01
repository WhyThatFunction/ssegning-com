# syntax=docker/dockerfile:1
#
# apps/cms — Strapi 5 (TypeScript, Postgres, S3 uploads), built from a pnpm
# workspace. Build context is the REPO ROOT (see .github/workflows/ci.yml),
# same reasoning as apps/web/Dockerfile: a pnpm workspace install needs the
# root lockfile plus every workspace member's package.json.
#
# Base image: node:22-slim (Debian bookworm-slim, glibc) for every stage —
# NOT node:22-alpine. Strapi's built-in image-processing dependency `sharp`
# (used on every media upload) and better-sqlite3 (present as an
# optional/devDependency in Strapi's own project template even though this
# project runs Postgres) both ship prebuilt native binaries for glibc-linux
# targets, not for musl (alpine). On alpine those binaries have no
# prebuilt artifact and fall back to a from-source compile that needs
# `vips-dev`, `libc6-compat` and full build tooling — a well-known class of
# "works locally, breaks in the container" Strapi bug. slim sidesteps the
# whole class of problem for a larger-but-boring base image, which is the
# right trade for the CMS.

FROM node:22-slim AS deps
WORKDIR /app
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable

# Manifests only first, so this layer is cached until a dependency actually
# changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/cms/package.json apps/cms/package.json
RUN pnpm install --frozen-lockfile

FROM node:22-slim AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable
COPY --from=deps /app ./
COPY . .

# NODE_ENV=production is required here: Strapi's `build` CLI command reads
# it to compile the TypeScript server into dist/ and produce the
# production-optimized admin-panel bundle — a dev-mode bundle is refused by
# a production `strapi start`. (Strapi's own production Dockerfile example
# sets the equivalent for `yarn build` — see
# strapi/documentation docs/dev-docs/deployment.md, "Strapi Production
# Build".)
ENV NODE_ENV=production
RUN pnpm --filter @ssegning/cms build

# `pnpm deploy --filter=<pkg> --prod <dir>` is pnpm's own documented
# pattern for turning one package out of a workspace into a self-contained,
# production-pruned directory for exactly this multi-app-monorepo-Docker
# case (see pnpm.io/docker, "Multi-stage monorepo workspace build"). It
# copies apps/cms's build output (dist/, package.json, ...) plus only its
# *production* dependencies — no devDependencies, no apps/web — into
# /prod/cms, which becomes the entire runtime image below.
RUN pnpm deploy --legacy --filter=@ssegning/cms --prod /prod/cms

# ---------------------------------------------------------------------------
# Runner
FROM node:22-slim AS runner
RUN groupadd --gid 1001 strapi \
 && useradd --uid 1001 --gid strapi --shell /usr/sbin/nologin --create-home strapi

WORKDIR /app
# `WORKDIR` creates /app as root *before* anything is copied into it, so
# `COPY --chown` below (which only chowns the files/dirs it writes) leaves
# the /app mountpoint itself root-owned. That silently breaks Strapi at
# runtime: `database/migrations` ships empty in source (git — and
# therefore `pnpm deploy`, see the builder stage above — never tracks
# empty directories), so Strapi tries to `mkdir -p database/migrations`
# on first boot, which needs *write* permission on /app itself, not just
# on its existing contents. Fixing /app's own ownership here (in addition
# to `--chown` on the COPY) is what makes that — and the rest of what
# Strapi writes at runtime: .tmp/ (cache) and, transiently, public/uploads/
# before the S3 upload provider takes over — actually work as non-root.
RUN chown strapi:strapi /app
COPY --from=builder --chown=strapi:strapi /prod/cms ./

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337
EXPOSE 1337

USER strapi

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('node:http').get('http://127.0.0.1:1337/_health',(r)=>process.exit(r.statusCode===204?0:1)).on('error',()=>process.exit(1))"

# Invoke the Strapi CLI binary directly with `node`, rather than `pnpm
# start` / `pnpm --filter @ssegning/cms start`: `pnpm deploy` above already
# flattened apps/cms into the image root (so there is no workspace left to
# filter into), and going through `pnpm` at runtime would make corepack
# fetch the pinned pnpm version over the network on first invocation since
# only the *build* stages primed corepack's cache. Calling the compiled CLI
# straight from node_modules keeps container start hermetic — this is the
# `node .../strapi/bin/strapi.js start` form CONTRACT.md calls out as the
# "better" of its two suggested CMDs, and it mirrors Strapi's own
# production Dockerfile example's `CMD ["yarn", "start"]` (which likewise
# just runs the `start` script -> `strapi start` under the hood).
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]

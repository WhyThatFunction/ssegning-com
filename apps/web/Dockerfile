# syntax=docker/dockerfile:1
#
# apps/web — Next.js 16 (App Router, Tailwind v4), built from a pnpm
# workspace. Build context is the REPO ROOT (see .github/workflows/ci.yml),
# because a pnpm workspace install needs the root lockfile plus every
# workspace member's package.json to resolve --frozen-lockfile.
#
# Base image: node:22-alpine for every stage. apps/web has no server-side
# native addons of its own; the only risk is Next.js's own optional
# `next/image` -> sharp path, so `libc6-compat` is installed defensively
# (this is also what Next.js's own official Docker example does for
# alpine — see examples/with-docker-multi-env/docker/production/Dockerfile
# upstream) even though nothing in this app currently requires it. That
# keeps the image small; apps/cms carries the real sharp/native-addon risk
# and uses node:22-slim instead (see apps/cms/Dockerfile for why).

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable

# Manifests only first, so this layer is cached until a dependency actually
# changes — pnpm needs the whole workspace's package.json set (not just
# apps/web's) to compute a --frozen-lockfile install against the single
# root pnpm-lock.yaml.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/cms/package.json apps/cms/package.json
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable
COPY --from=deps /app ./
COPY . .
ENV NODE_ENV=production
RUN pnpm --filter @ssegning/web build

# ---------------------------------------------------------------------------
# Runner
#
# With `output: 'standalone'` (required by CONTRACT.md) in a pnpm workspace,
# Next.js traces file dependencies from the workspace root (the directory
# holding pnpm-lock.yaml / pnpm-workspace.yaml), not from apps/web/. The
# generated .next/standalone tree therefore mirrors the full workspace path
# instead of collapsing to its own root:
#
#   apps/web/.next/standalone/
#     apps/web/server.js          <- entrypoint (NOT ./server.js)
#     apps/web/.next/...          <- server-side build output
#     node_modules/               <- pruned, hoisted deps for the whole trace
#
# This is standard, documented Next.js standalone-in-monorepo behavior
# (see the `outputFileTracingRoot` docs: the trace root just is the
# workspace root here since Next.js auto-detects it from the top-level
# lockfile), and it is why the CMD below is `node apps/web/server.js`
# rather than the single-package convention `node server.js` shown in
# Next.js's own non-monorepo Docker example.
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000

USER nextjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:3000/api/healthz || exit 1

CMD ["node", "apps/web/server.js"]

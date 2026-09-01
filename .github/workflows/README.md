# CI

`ci.yml` runs on every push to `main`, every pull request, and manual
dispatch.

1. **`lint`** — installs the workspace, runs `biome ci .`, and does a smoke
   build of `apps/web` (fast feedback, catches broken TS/build config on
   every PR).
2. **`images`** — push-to-`main` (or manual dispatch) only. Matrix-builds
   and pushes `apps/web` and `apps/cms` as linux/amd64 images to
   `ghcr.io/whythatfunction/ssegning-com/{web,cms}`, tagged `main` and
   `sha-<7charsha>`.
3. **`bump`** — push-to-`main` only, after `images`. Rewrites
   `.web.image.tag` / `.cms.image.tag` in `deploy/chart/values.yaml` to the
   `sha-<7charsha>` just pushed and commits straight to `main` with
   `[skip ci]` in the message (ArgoCD picks up the change from there — this
   repo has no deploy step of its own).

## Why this can't loop forever

The `bump` commit's message contains `[skip ci]`. The `images` job (and
therefore `bump`, which needs it) explicitly refuses to run when the
triggering push's commit message contains that marker, so the bump commit's
own CI run does lint-only and stops — it never rebuilds images or bumps
tags again.

## Dependency: `deploy/chart/values.yaml`

The `bump` job assumes `deploy/chart/values.yaml` exists with `.web.image.tag`
and `.cms.image.tag` keys already present (see `CONTRACT.md`). If that chart
hasn't landed yet, this step will fail — that's expected until it does.

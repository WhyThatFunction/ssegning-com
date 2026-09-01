# ssegning-com Helm chart

Deploys ssegning.com (Next.js web + Strapi CMS + CNPG Postgres) onto the
Talos in-cluster ArgoCD destination (`server: https://kubernetes.default.svc`),
namespace `ssegning`. Plain hand-authored templates, no chart dependencies —
`helm template`/`helm lint` work with zero setup.

```bash
helm dependency build deploy/chart   # no-op: no dependencies, kept for parity with other charts in this org
helm template ssegning-com deploy/chart
helm lint deploy/chart
```

## AWS Secrets Manager requirements

All three `ExternalSecret`s in this chart read from **one** secret in
`ClusterSecretStore/ssegning-aws` (AWS Secrets Manager, eu-central-1):

```
ssegning/prod/env
```

That secret must contain every property below (JSON keys, one property per
env var this chart injects):

| Property                | Consumed by                                     | Purpose |
|--------------------------|--------------------------------------------------|---------|
| `postgres_password`     | `ssegning-pg-owner`, `ssegning-cms-secrets`      | CNPG owner-role password AND the CMS's `DATABASE_PASSWORD` (same value, both sides) |
| `strapi_app_keys`       | `ssegning-cms-secrets` → `APP_KEYS`              | Strapi session keys (comma-separated, 4 keys) |
| `strapi_api_token_salt` | `ssegning-cms-secrets` → `API_TOKEN_SALT`        | Strapi API token salt |
| `strapi_admin_jwt_secret` | `ssegning-cms-secrets` → `ADMIN_JWT_SECRET`    | Strapi admin JWT signing secret |
| `strapi_transfer_token_salt` | `ssegning-cms-secrets` → `TRANSFER_TOKEN_SALT` | Strapi data-transfer token salt |
| `strapi_jwt_secret`     | `ssegning-cms-secrets` → `JWT_SECRET`            | Strapi Users & Permissions JWT secret |
| `strapi_encryption_key` | `ssegning-cms-secrets` → `ENCRYPTION_KEY`        | Strapi field encryption key |
| `s3_access_key`         | `ssegning-cms-secrets` → `S3_ACCESS_KEY_ID`      | MinIO (s3.ssegning.me) access key |
| `s3_secret_key`         | `ssegning-cms-secrets` → `S3_SECRET_ACCESS_KEY`  | MinIO secret key |
| `revalidate_secret`     | `ssegning-cms-secrets` → `WEB_REVALIDATE_SECRET`, `ssegning-web-secrets` → `REVALIDATE_SECRET` | Shared secret between web's `/api/revalidate` route and the CMS's outbound revalidate call — must be the SAME value both places |
| `admin_email`           | `ssegning-cms-secrets` → `ADMIN_EMAIL`           | Strapi super-admin bootstrap (CONTRACT.md ADDENDUM 1) |
| `admin_password`        | `ssegning-cms-secrets` → `ADMIN_PASSWORD`        | Strapi super-admin bootstrap |
| `admin_firstname`       | `ssegning-cms-secrets` → `ADMIN_FIRSTNAME`       | Strapi super-admin bootstrap |
| `admin_lastname`        | `ssegning-cms-secrets` → `ADMIN_LASTNAME`        | Strapi super-admin bootstrap |

The exact property→env-var mapping lives in `values.yaml` under
`externalSecrets.cms.mappings` / `externalSecrets.web.mappings` /
`externalSecrets.postgresOwner` — add a property there (not in a template)
if a new secret-backed env var is ever needed.

## values.yaml reference

- **`web.*`** — image (`repository`/`tag`/`pullPolicy`; CI rewrites
  `web.image.tag` with `yq`), `replicas`, `serviceName`/`port` (also used by
  `cms.yaml` to build `WEB_REVALIDATE_URL`), `resources`, and
  `env.nextPublicSiteUrl` (→ `NEXT_PUBLIC_SITE_URL`).
- **`cms.*`** — image (CI rewrites `cms.image.tag`), `serviceName`/`port`
  (also used by `web.yaml` to build `STRAPI_URL`), `resources`, and the
  plain (non-secret) Strapi env values (`publicUrl`, `adminBackendUrl`,
  `s3Endpoint`, `s3Region`, `s3Bucket`, `s3PublicBase`).
- **`postgres.*`** — CNPG `Cluster` name, `instances`, patch-pinned
  `imageName` (see the comment on that key for how it was verified before
  pinning), `database`/`owner`/`port`, `storage.size`/`storageClass`,
  `resources`. The CMS's `DATABASE_HOST` is derived as
  `<postgres.name>-rw` (CNPG's own naming convention for its read-write
  Service) rather than being a separate value.
- **`externalSecrets.*`** — `storeName`/`storeKind`/`remoteKey`/
  `refreshInterval` shared by all three `ExternalSecret`s, plus
  `postgresOwner`/`cms`/`web` (each with a `secretName` and either a fixed
  `username`/`passwordRemoteProperty` pair or a `mappings` list of
  `{key, remoteProperty}`). Adding a `mappings` entry is enough to add a new
  secret-backed env var — `cms.yaml`/`web.yaml` range over these lists to
  build both the container's `env` and the underlying `ExternalSecret`, so
  the two can't drift apart.
- **`certificate.*`** — cert-manager `Certificate` `secretName`/
  `issuerName`/`issuerKind`/`dnsNames`. No `commonName` (see
  `templates/certificate.yaml`'s comment).
- **`ingress.*`** — `className`, `tlsSecretName`, `web.host` (apex only —
  see below), `cms.host`, and `redirect.hosts`/`targetUrl`/`middlewareName`
  for the 301 redirects.

## Why www.ssegning.com isn't on the apex Ingress

`ingress.web.host` is `ssegning.com` only. `www.ssegning.com` is handled
exclusively by the `ssegning-redirect` Ingress (redirecting to the apex via
the `redirect-to-apex` Traefik `Middleware`). Listing `www` as a second host
on the apex Ingress *and* on the redirect Ingress would mean two Ingress
objects declaring a Host+PathPrefix router for the identical hostname —
Traefik's behavior in that case is an undefined-priority collision, not a
predictable "last applied wins." Keeping `www` on exactly one Ingress is
what actually makes this work, not just what makes the apex Ingress "look"
clean.

## Known gaps / things not verified from this chart alone

- **CMS `.tmp` emptyDir and web's `readOnlyRootFilesystem`** were left at
  the safer-but-more-permissive default (writable root filesystem) because
  `apps/cms`'s and `apps/web`'s actual Dockerfiles (built concurrently
  elsewhere in this monorepo) weren't visible from this chart's scope.
  Once those images are final, revisit `templates/cms.yaml` (add a
  `.tmp`-path `emptyDir` if the WORKDIR is confirmed) and
  `templates/web.yaml` (flip `readOnlyRootFilesystem: true` + mount the
  actual Next.js cache dir(s) as `emptyDir`, not just `/tmp`).
- **ArgoCD Application manifest itself** (destination namespace `ssegning`,
  `CreateNamespace=true`, sync policy/waves) lives outside `deploy/chart` —
  this chart only renders what ArgoCD applies *into* that namespace, not
  the Application resource that points ArgoCD at it.

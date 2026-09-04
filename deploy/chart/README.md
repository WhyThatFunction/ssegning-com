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

Most `ExternalSecret`s in this chart read from **one** secret in
`ClusterSecretStore/ssegning-aws` (AWS Secrets Manager, eu-central-1):

```
ssegning/prod/env
```

but a mapping under `externalSecrets.cms.mappings` may instead set its own
`remoteKey` to pull from a *different* secret in the same
`ClusterSecretStore` — used for credentials this app doesn't own (a shared
fleet/infra credential). `SMTP_SASL_USERS` below is the one such case today;
see the "Remote secret" column.

`ssegning/prod/env` must contain every property below with a `-` in the
Remote secret column (JSON keys, one property per env var this chart
injects):

| Property                | Remote secret | Consumed by                                     | Purpose |
|--------------------------|---------------|--------------------------------------------------|---------|
| `postgres_password`     | -             | `ssegning-pg-owner`, `ssegning-cms-secrets`      | CNPG owner-role password AND the CMS's `DATABASE_PASSWORD` (same value, both sides) |
| `strapi_app_keys`       | -             | `ssegning-cms-secrets` → `APP_KEYS`              | Strapi session keys (comma-separated, 4 keys) |
| `strapi_api_token_salt` | -             | `ssegning-cms-secrets` → `API_TOKEN_SALT`        | Strapi API token salt |
| `strapi_admin_jwt_secret` | -           | `ssegning-cms-secrets` → `ADMIN_JWT_SECRET`    | Strapi admin JWT signing secret |
| `strapi_transfer_token_salt` | -        | `ssegning-cms-secrets` → `TRANSFER_TOKEN_SALT` | Strapi data-transfer token salt |
| `strapi_jwt_secret`     | -             | `ssegning-cms-secrets` → `JWT_SECRET`            | Strapi Users & Permissions JWT secret |
| `strapi_encryption_key` | -             | `ssegning-cms-secrets` → `ENCRYPTION_KEY`        | Strapi field encryption key |
| `s3_access_key`         | -             | `ssegning-cms-secrets` → `S3_ACCESS_KEY_ID`      | MinIO (s3.ssegning.me) access key |
| `s3_secret_key`         | -             | `ssegning-cms-secrets` → `S3_SECRET_ACCESS_KEY`  | MinIO secret key |
| `revalidate_secret`     | -             | `ssegning-cms-secrets` → `WEB_REVALIDATE_SECRET`, `ssegning-web-secrets` → `REVALIDATE_SECRET` | Shared secret between web's `/api/revalidate` route and the CMS's outbound revalidate call — must be the SAME value both places |
| `admin_email`           | -             | `ssegning-cms-secrets` → `ADMIN_EMAIL`           | Strapi super-admin bootstrap (CONTRACT.md ADDENDUM 1) |
| `admin_password`        | -             | `ssegning-cms-secrets` → `ADMIN_PASSWORD`        | Strapi super-admin bootstrap |
| `admin_firstname`       | -             | `ssegning-cms-secrets` → `ADMIN_FIRSTNAME`       | Strapi super-admin bootstrap |
| `admin_lastname`        | -             | `ssegning-cms-secrets` → `ADMIN_LASTNAME`        | Strapi super-admin bootstrap |
| `s3_access_key`         | -             | `ssegning-cnpg-s3-creds` → `accessKeyId`         | barman-cloud backups (same MinIO access key as the CMS uploads, additionally granted access to the private `ssegning-cnpg-backups` bucket) |
| `s3_secret_key`         | -             | `ssegning-cnpg-s3-creds` → `secretKey`           | barman-cloud backups (same MinIO secret key as the CMS uploads) |
| `smtpd_sasl_users`      | `prod/meta/test-app` | `ssegning-cms-secrets` → `SMTP_SASL_USERS` | SASL credentials the `mail` SMTP relay (`mail-system` namespace) itself is configured with — shared infra credential, NOT owned by this app; same secret `imagePullSecret.remoteKey` already reads |

The exact property→env-var mapping (and, for `SMTP_SASL_USERS`, which
remote secret it reads instead of the default) lives in `values.yaml` under
`externalSecrets.cms.mappings` / `externalSecrets.web.mappings` /
`externalSecrets.postgresOwner` — add a property there (not in a template)
if a new secret-backed env var is ever needed; give the mapping its own
`remoteKey` only if the value should come from a secret other than
`ssegning/prod/env`.

## Outbound mail + notifications

The CMS sends mail and alerts through two other in-cluster services, never
directly to the public Internet:

- **SMTP** — `cms.env.smtpHost`/`smtpPort` point at the `mail` Service in
  the `mail-system` namespace
  (`mail.mail-system.svc.cluster.local:587`, STARTTLS submission, SASL
  auth required). The CMS only ever talks to this in-cluster relay; the
  postfix pod behind it is what makes the real outbound TLS connection
  further upstream. `cms.env.emailDefaultFrom` must stay within the
  relay's own `ALLOWED_SENDER_DOMAINS` allow-list or postfix rejects the
  message outright at submission time. The relay's SASL credentials are
  injected as `SMTP_SASL_USERS`, sourced from AWS Secrets Manager secret
  `prod/meta/test-app` (property `smtpd_sasl_users`) — see the table above.
  `cms.env.smtpSaslRealm` (→ `SMTP_SASL_REALM`) qualifies the SASL username
  before authenticating (`user` -> `user@localdomain`) — required because
  the relay's own config has `mydomain=localdomain` and an EMPTY
  `smtpd_sasl_local_domain`, so its Cyrus sasldb entry is literally
  `user@localdomain` and a bare username resolves against `myhostname`
  instead, failing with `535 5.7.8`. This value tracks the relay's own
  config, not this chart's — see the comment on `smtpSaslRealm` in
  `values.yaml`.
- **Apprise** — `cms.env.appriseUrl` points at the `apprise` Service in the
  `notification-system` namespace
  (`http://apprise.notification-system.svc.cluster.local:8000`). Apprise
  itself is stateless (no persistent per-app config); the CMS supplies the
  target notification URL(s) on every call via `cms.env.appriseAlertTo`
  (→ `APPRISE_ALERT_TO`). That makes `appriseAlertTo` the swap point for
  moving alerts off email onto another Apprise-supported channel later.

## values.yaml reference

- **`web.*`** — image (`repository`/`tag`/`pullPolicy`; CI rewrites
  `web.image.tag` with `yq`), `replicas`, `serviceName`/`port` (also used by
  `cms.yaml` to build `WEB_REVALIDATE_URL`), `resources`,
  `env.nextPublicSiteUrl` (→ `NEXT_PUBLIC_SITE_URL`), and `giscus.*`
  (`enabled`/`repo`/`repoId`/`category`/`categoryId`) for the journal's
  GitHub-Discussions comment widget. The four giscus identifiers are read
  **server-side at request time** by `apps/web`'s article page and passed
  down as props — not exposed as `NEXT_PUBLIC_*` — specifically so a change
  here takes effect on the next pod restart with no image rebuild; see the
  long comment on `web.giscus` in `values.yaml` and "Comments" in
  `apps/web/README.md` for why. None of the four are secrets. Comments
  additionally require a one-time human step: installing the
  [giscus GitHub App](https://github.com/apps/giscus) on
  `WhyThatFunction/ssegning-com`.
- **`cms.*`** — image (CI rewrites `cms.image.tag`), `serviceName`/`port`
  (also used by `web.yaml` to build `STRAPI_URL`), `resources`, and the
  plain (non-secret) Strapi env values (`publicUrl`, `adminBackendUrl`,
  `s3Endpoint`, `s3Region`, `s3Bucket`, `s3PublicBase`, `smtpHost`,
  `smtpPort`, `smtpSaslRealm`, `emailDefaultFrom`, `emailDefaultReplyTo`,
  `appriseUrl`, `appriseAlertTo` — see "Outbound mail + notifications"
  below for the latter seven).
- **`postgres.*`** — CNPG `Cluster` name, `instances`, patch-pinned
  `imageName` (see the comment on that key for how it was verified before
  pinning), `database`/`owner`/`port`, `storage.size`/`storageClass`,
  `resources`. The CMS's `DATABASE_HOST` is derived as
  `<postgres.name>-rw` (CNPG's own naming convention for its read-write
  Service) rather than being a separate value.
- **`backup.*`** — barman-cloud backups + continuous WAL archival for the
  `postgres.*` Cluster, rendered by `templates/postgres.yaml` as a
  `barmancloud.cnpg.io/v1` `ObjectStore` + a `ScheduledBackup` + the
  Cluster's `spec.plugins` entry, all guarded by `backup.enabled`.
  `endpoint` is the self-hosted MinIO (`https://s3.ssegning.me`,
  path-style); `bucket`/`path` compose the `s3://` destination
  (`s3://<bucket><path>`) — **`bucket` is deliberately a different,
  private bucket (`ssegning-cnpg-backups`) from the public `cms.env.s3Bucket`
  media bucket**, since backups must never be world-readable; `retention`
  is barman-cloud's `retentionPolicy` (e.g. `30d`); `schedule` is the
  `ScheduledBackup`'s cron — **CNPG uses a SIX-field cron (seconds first)**,
  not the usual 5-field crontab, so `"0 0 3 * * *"` means daily at 03:00,
  not hourly. The S3 credentials themselves live under
  `externalSecrets.backup` (below), not here.
- **`externalSecrets.*`** — `storeName`/`storeKind`/`remoteKey`/
  `refreshInterval` shared by all `ExternalSecret`s, plus
  `postgresOwner`/`cms`/`web`/`backup` (each with a `secretName` and either
  a fixed `username`/`passwordRemoteProperty` pair, a `mappings` list of
  `{key, remoteProperty}`, or — for `backup` — a fixed
  `accessKeyId`/`secretKey` pair via `accessKeyRemoteProperty`/
  `secretKeyRemoteProperty`, matching barman-cloud's `s3Credentials`
  contract). Adding a `mappings` entry is enough to add a new secret-backed
  env var — `cms.yaml`/`web.yaml` range over these lists to build both the
  container's `env` and the underlying `ExternalSecret`, so the two can't
  drift apart. `externalSecrets.backup` deliberately reuses the same
  `s3_access_key`/`s3_secret_key` remote properties as `externalSecrets.cms`
  — one MinIO user, now granted access to both the public uploads bucket
  and the private backups bucket — materialized into its own
  `ssegning-cnpg-s3-creds` Secret because barman-cloud expects exactly
  `accessKeyId`/`secretKey` keys.
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

- **CMS `.tmp` emptyDir and web's `readOnlyRootFilesystem`** are still at
  the safer-but-more-permissive default (writable root filesystem,
  `readOnlyRootFilesystem: false` in both `templates/cms.yaml` and
  `templates/web.yaml`). The original reason this was deferred — the
  Dockerfiles not being visible from this chart's scope — is stale: both
  `apps/cms/Dockerfile` and `apps/web/Dockerfile` are committed now, and
  confirm the runtime write paths a hardening pass would need to carve out
  as `emptyDir` mounts: the CMS's Strapi process writes `.tmp/` (cache) and
  transiently `public/uploads/` relative to its `/app` WORKDIR (see the
  Dockerfile's comment on `chown strapi:strapi /app`), and web's Next.js
  standalone server writes its ISR/on-demand-revalidation cache under
  `apps/web/.next/cache` (see the comment on `readOnlyRootFilesystem` in
  `templates/web.yaml`). Tightening this to `readOnlyRootFilesystem: true` +
  explicit `emptyDir` mounts at those exact paths is still open work, not
  something blocked on missing information anymore.
- **ArgoCD Application manifest itself** (destination namespace `ssegning`,
  `CreateNamespace=true`, sync policy/waves) lives outside `deploy/chart` —
  this chart only renders what ArgoCD applies *into* that namespace, not
  the Application resource that points ArgoCD at it.

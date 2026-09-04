export interface SmtpCredentials {
  user: string;
  pass: string;
}

/**
 * Parses the raw value of the in-cluster postfix relay's `SMTPD_SASL_USERS`
 * property (bokysan/docker-postfix) into a single `{ user, pass }` pair.
 *
 * That env var holds a list of `user:password` entries, but upstream's own
 * docs/examples are inconsistent about the separator between entries —
 * comma, semicolon, plain whitespace and newlines all appear in the wild.
 * So this is deliberately tolerant: it splits on any of `,`, `;`, or
 * whitespace/newlines, takes the first non-empty entry, then splits THAT
 * entry on the FIRST `:` only (a password may itself contain `:`). Do not
 * "simplify" this back to a single fixed separator — it will break for any
 * relay config that doesn't happen to match whatever separator was tested.
 *
 * Returns null when the input is empty/unset, or when either the user or
 * password half is empty after trimming — callers should treat that as
 * "no SMTP auth configured" (expected in local dev).
 */
export function parseSaslCredentials(raw: string | undefined | null): SmtpCredentials | null {
  if (!raw) {
    return null;
  }

  const entries = raw
    .split(/[,;\s]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const first = entries[0];
  if (!first) {
    return null;
  }

  const separatorIndex = first.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }

  const user = first.slice(0, separatorIndex).trim();
  const pass = first.slice(separatorIndex + 1).trim();

  if (!user || !pass) {
    return null;
  }

  return { user, pass };
}

/**
 * Qualifies a SASL username with a realm (`user` -> `user@realm`), the fix
 * for a live 535 auth failure diagnosed empirically against the production
 * relay on 2026-09-04.
 *
 * Mechanism: the relay (bokysan/docker-postfix) has `mydomain = localdomain`,
 * `myhostname = mail-0`, and `smtpd_sasl_local_domain =` left EMPTY. Its
 * Cyrus sasldb holds exactly one entry, literally `user@localdomain`. Cyrus
 * SASL resolves a bare username (no `@`) against the *server's* domain —
 * and with `smtpd_sasl_local_domain` empty, that resolution falls back to
 * `myhostname` (`mail-0`), not `mydomain`. So a bare `user` gets looked up
 * as `user@mail-0`, which doesn't match the stored `user@localdomain`, and
 * auth fails with `535 5.7.8`. Sending `user@localdomain` verbatim makes
 * Cyrus split on `@` and find the entry directly, bypassing that fallback
 * resolution entirely.
 *
 * Confirmed by testing all three variants against the live relay from
 * inside the CMS pod:
 *   bare username    => FAILED 535
 *   user@localdomain => AUTH OK      <-- this function's job
 *   user@mail-0       => FAILED 535
 *
 * Do not "simplify" this away — the relay's own config (empty
 * `smtpd_sasl_local_domain`) is what makes qualification mandatory, not a
 * style preference. If the relay ever sets `smtpd_sasl_local_domain` or
 * changes `mydomain`, this needs to change with it (see
 * `deploy/chart/values.yaml`'s `cms.env.smtpSaslRealm` comment).
 *
 * Rules: an empty/unset `realm` returns `user` unchanged (matches today's
 * pre-fix behaviour, e.g. local dev with no realm configured). A `user`
 * that already contains `@` is returned unchanged — it's already qualified,
 * and qualifying it again would produce `user@domain@realm`, which the
 * sasldb would never match.
 */
export function qualifySaslUser(user: string, realm: string | undefined | null): string {
  if (!realm) {
    return user;
  }

  if (user.includes('@')) {
    return user;
  }

  return `${user}@${realm}`;
}

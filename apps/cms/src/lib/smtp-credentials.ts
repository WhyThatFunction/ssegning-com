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

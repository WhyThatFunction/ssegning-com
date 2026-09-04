import type { Core } from '@strapi/strapi';
import { parseSaslCredentials } from './smtp-credentials';

export type AppriseNotificationType = 'info' | 'success' | 'warning' | 'failure';

export interface AppriseNotifyOptions {
  title: string;
  body: string;
  type: AppriseNotificationType;
  /** Optional Strapi instance, used only for logging via `strapi.log`. */
  strapi?: Core.Strapi;
}

function log(level: 'warn' | 'info', message: string, strapi?: Core.Strapi): void {
  if (strapi) {
    strapi.log[level](message);
  } else {
    console[level === 'warn' ? 'warn' : 'log'](message);
  }
}

/**
 * Builds the `urls` value for an Apprise `/notify` call.
 *
 * When `APPRISE_ALERT_URLS` is set, it is used verbatim — that's the
 * intended swap point for moving alerts to Slack, Telegram, etc. later
 * without touching this code. Otherwise a `mailto://` URL is derived from
 * the same SMTP credentials already used for outbound mail, so alerting
 * works out of the box on top of the existing relay.
 *
 * The SASL user is frequently an email address (contains `@`), and the
 * password may contain arbitrary characters — both are URL-encoded so they
 * can't break parsing of the `mailto://user:pass@host:port/...` URL.
 */
function deriveAlertUrls(): string | null {
  const explicit = process.env.APPRISE_ALERT_URLS;
  if (explicit) {
    return explicit;
  }

  const alertTo = process.env.APPRISE_ALERT_TO;
  const host = process.env.SMTP_HOST;
  if (!alertTo || !host) {
    return null;
  }

  const port = process.env.SMTP_PORT || '587';
  const credentials = parseSaslCredentials(process.env.SMTP_SASL_USERS);
  if (!credentials) {
    return null;
  }

  const from = process.env.EMAIL_DEFAULT_FROM || 'no-reply@ssegning.com';
  const user = encodeURIComponent(credentials.user);
  const pass = encodeURIComponent(credentials.pass);
  const to = encodeURIComponent(alertTo);
  const fromParam = encodeURIComponent(from);

  // `mode=starttls` matches the relay's port-587 submission. `verify=no`
  // disables certificate verification for the same reason the nodemailer
  // transport sets `rejectUnauthorized: false` (see config/plugins.ts): the
  // relay presents a self-signed cert and the hop never leaves the cluster.
  // Without it Apprise's smtplib call fails the handshake and the alert is
  // silently dropped.
  return `mailto://${user}:${pass}@${host}:${port}/?to=${to}&from=${fromParam}&mode=starttls&verify=no`;
}

/**
 * Sends a notification through the in-cluster Apprise instance
 * (`APPRISE_URL`), which fans it out to whatever notification URLs are
 * configured. Apprise itself is stateless — it has no persistent config —
 * so the target URLs are supplied on every call.
 *
 * This is a best-effort side channel, never a critical path: it never
 * throws, and it times out after 5s so a hung Apprise instance can't wedge
 * Strapi boot. If `APPRISE_URL` is unset, or no target urls can be derived
 * (local dev, most likely), this silently no-ops — that's environment
 * absence, not a feature flag.
 */
export async function notify({ title, body, type, strapi }: AppriseNotifyOptions): Promise<void> {
  const appriseUrl = process.env.APPRISE_URL;
  if (!appriseUrl) {
    return;
  }

  const urls = deriveAlertUrls();
  if (!urls) {
    return;
  }

  try {
    const response = await fetch(`${appriseUrl.replace(/\/+$/, '')}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, title, body, type, format: 'text' }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      log('warn', `[lib/apprise] notify failed with status ${response.status}`, strapi);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log('warn', `[lib/apprise] notify threw: ${message}`, strapi);
  }
}

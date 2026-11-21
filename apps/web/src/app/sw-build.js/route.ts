/**
 * Imported by the service worker (public/sw.js) to learn which build it
 * belongs to. The browser compares a worker's imported scripts as well as the
 * worker itself when checking for an update, so a new value here, once per
 * deploy, is what installs a fresh worker.
 *
 * SW_BUILD_ID is inlined at build time by next.config.ts from GIT_SHA, which
 * CI passes as a Docker build argument. Served `no-store` (next.config.ts).
 */
export const dynamic = 'force-static';

export function GET() {
  return new Response(`self.SW_BUILD = ${JSON.stringify(process.env.SW_BUILD_ID ?? 'dev')};\n`, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
  });
}

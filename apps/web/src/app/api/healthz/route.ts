import { NextResponse } from 'next/server';

// Liveness probe for this web app only. Must never touch Strapi — a Strapi
// outage should not fail this app's own health check.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

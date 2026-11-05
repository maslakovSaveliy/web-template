import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Readiness probe for Docker HEALTHCHECK and the deploy gate. Exposes nothing sensitive. */
export function GET(): NextResponse {
  return NextResponse.json(
    { status: 'ok', uptime: Math.round(process.uptime()) },
    { headers: { 'cache-control': 'no-store' } },
  );
}

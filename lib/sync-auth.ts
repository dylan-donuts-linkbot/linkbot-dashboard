import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates the OPENCLAW_API_KEY header on sync API routes.
 * Returns null if valid, or a 401 NextResponse to return immediately.
 */
export function validateSyncAuth(request: NextRequest): NextResponse | null {
  const expected = process.env.OPENCLAW_API_KEY
  if (!expected) {
    return NextResponse.json({ error: 'Sync API not configured (OPENCLAW_API_KEY missing)' }, { status: 503 })
  }

  const provided = request.headers.get('x-openclaw-api-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/, '')
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

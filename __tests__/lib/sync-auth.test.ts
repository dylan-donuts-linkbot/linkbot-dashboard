import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { validateSyncAuth } from '@/lib/sync-auth'

const VALID_KEY = 'test-secret-key'

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/sync/test', { headers })
}

describe('validateSyncAuth', () => {
  beforeEach(() => {
    process.env.OPENCLAW_API_KEY = VALID_KEY
  })

  afterEach(() => {
    delete process.env.OPENCLAW_API_KEY
  })

  it('returns null (valid) when x-openclaw-api-key matches', () => {
    const req = makeRequest({ 'x-openclaw-api-key': VALID_KEY })
    expect(validateSyncAuth(req)).toBeNull()
  })

  it('returns null (valid) when Authorization: Bearer matches', () => {
    const req = makeRequest({ authorization: `Bearer ${VALID_KEY}` })
    expect(validateSyncAuth(req)).toBeNull()
  })

  it('returns 401 when key is missing', async () => {
    const req = makeRequest()
    const res = validateSyncAuth(req)
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
    const body = await res!.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 401 when key is wrong', async () => {
    const req = makeRequest({ 'x-openclaw-api-key': 'wrong-key' })
    const res = validateSyncAuth(req)
    expect(res!.status).toBe(401)
  })

  it('returns 503 when OPENCLAW_API_KEY env var is not set', async () => {
    delete process.env.OPENCLAW_API_KEY
    const req = makeRequest({ 'x-openclaw-api-key': VALID_KEY })
    const res = validateSyncAuth(req)
    expect(res!.status).toBe(503)
    const body = await res!.json()
    expect(body.error).toMatch(/not configured/i)
  })
})

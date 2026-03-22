import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockClient } from '../../helpers/supabase-mock'

vi.mock('@/lib/supabase-service', () => ({ createServiceClient: vi.fn() }))

import { createServiceClient } from '@/lib/supabase-service'
import { POST } from '@/app/api/sync/log/route'

const VALID_KEY = 'test-key'
const LOG_ID = '00000000-0000-0000-0000-000000000010'

function makeRequest(body: unknown, key = VALID_KEY) {
  return new NextRequest('http://localhost/api/sync/log', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-openclaw-api-key': key,
    },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  process.env.OPENCLAW_API_KEY = VALID_KEY
  vi.mocked(createServiceClient).mockReset()
})

describe('POST /api/sync/log — auth', () => {
  it('returns 401 with wrong key', async () => {
    const res = await POST(makeRequest({ agent: 'openclaw', action: 'task_complete', summary: 'done' }, 'bad'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/sync/log — validation', () => {
  beforeEach(() => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([]) as ReturnType<typeof createServiceClient>
    )
  })

  it('returns 400 when agent is missing', async () => {
    const res = await POST(makeRequest({ action: 'task_complete', summary: 'done' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/agent/)
  })

  it('returns 400 when action is missing', async () => {
    const res = await POST(makeRequest({ agent: 'openclaw', summary: 'done' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/action/)
  })

  it('returns 400 when summary is missing', async () => {
    const res = await POST(makeRequest({ agent: 'openclaw', action: 'task_complete' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/summary/)
  })

  it('returns 400 when summary is whitespace-only', async () => {
    const res = await POST(makeRequest({ agent: 'openclaw', action: 'task_complete', summary: '   ' }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/sync/log — happy path', () => {
  it('writes log entry and returns log_id', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: { id: LOG_ID }, error: null }]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      agent: 'openclaw',
      action: 'task_complete',
      summary: 'Finished building the kanban page',
      task_id: '00000000-0000-0000-0000-000000000001',
      project_id: '00000000-0000-0000-0000-000000000002',
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.log_id).toBe(LOG_ID)
  })

  it('accepts optional metadata', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: { id: LOG_ID }, error: null }]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      agent: 'dev',
      action: 'agent_spawned',
      summary: 'Spawned coding agent',
      metadata: { model: 'claude-haiku-4-5', tokens: 1200 },
    }))

    expect(res.status).toBe(200)
  })

  it('works without optional task_id and project_id', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: { id: LOG_ID }, error: null }]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      agent: 'openclaw',
      action: 'outbound_sync',
      summary: 'Pulled 3 tasks from dashboard',
    }))

    expect(res.status).toBe(200)
  })
})

describe('POST /api/sync/log — errors', () => {
  it('returns 500 when Supabase insert fails', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: null, error: { message: 'insert failed' } }]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      agent: 'openclaw',
      action: 'task_complete',
      summary: 'Done',
    }))

    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/failed to write agent_log/i)
  })
})

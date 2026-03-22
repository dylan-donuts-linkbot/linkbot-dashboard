import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockClient } from '../../helpers/supabase-mock'

vi.mock('@/lib/supabase-service', () => ({ createServiceClient: vi.fn() }))

import { createServiceClient } from '@/lib/supabase-service'
import { GET } from '@/app/api/sync/outbound/route'

const VALID_KEY = 'test-key'
const PROJECT_ID = '00000000-0000-0000-0000-000000000002'

function makeRequest(params: Record<string, string> = {}, key = VALID_KEY) {
  const url = new URL('http://localhost/api/sync/outbound')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), {
    headers: { 'x-openclaw-api-key': key },
  })
}

beforeEach(() => {
  process.env.OPENCLAW_API_KEY = VALID_KEY
  vi.mocked(createServiceClient).mockReset()
})

describe('GET /api/sync/outbound — auth', () => {
  it('returns 401 with missing key', async () => {
    const res = await GET(makeRequest({ table: 'tasks' }, ''))
    expect(res.status).toBe(401)
  })
})

describe('GET /api/sync/outbound — validation', () => {
  beforeEach(() => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: [], error: null }]) as ReturnType<typeof createServiceClient>
    )
  })

  it('returns 400 when table is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/table query param must be one of/)
  })

  it('returns 400 for invalid table name', async () => {
    const res = await GET(makeRequest({ table: 'secrets' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid since timestamp', async () => {
    const res = await GET(makeRequest({ table: 'tasks', since: 'not-a-date' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/valid iso timestamp/i)
  })
})

describe('GET /api/sync/outbound — happy path', () => {
  it('returns tasks with count', async () => {
    const tasks = [
      { id: '1', status: 'done', sync_status: 'local', updated_at: '2026-03-22T10:00:00Z' },
      { id: '2', status: 'todo', sync_status: 'local', updated_at: '2026-03-22T09:00:00Z' },
    ]
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: tasks, error: null }]) as ReturnType<typeof createServiceClient>
    )

    const res = await GET(makeRequest({ table: 'tasks' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(2)
    expect(body.data).toEqual(tasks)
  })

  it('returns empty result when no records found', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: [], error: null }]) as ReturnType<typeof createServiceClient>
    )

    const res = await GET(makeRequest({ table: 'projects' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(0)
    expect(body.data).toEqual([])
  })

  it('passes since param to the query', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: [], error: null }]) as ReturnType<typeof createServiceClient>
    )

    const since = '2026-03-22T00:00:00.000Z'
    const res = await GET(makeRequest({ table: 'tasks', since }))
    expect(res.status).toBe(200)

    const { from } = vi.mocked(createServiceClient).mock.results[0].value
    const chain = (from as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(chain.gte).toHaveBeenCalledWith('updated_at', since)
  })

  it('filters by project_id when table is tasks', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: [], error: null }]) as ReturnType<typeof createServiceClient>
    )

    const res = await GET(makeRequest({ table: 'tasks', project_id: PROJECT_ID }))
    expect(res.status).toBe(200)

    const { from } = vi.mocked(createServiceClient).mock.results[0].value
    const chain = (from as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(chain.eq).toHaveBeenCalledWith('project_id', PROJECT_ID)
  })

  it('does not apply project_id filter when table is projects', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: [], error: null }]) as ReturnType<typeof createServiceClient>
    )

    const res = await GET(makeRequest({ table: 'projects', project_id: PROJECT_ID }))
    expect(res.status).toBe(200)

    const { from } = vi.mocked(createServiceClient).mock.results[0].value
    const chain = (from as ReturnType<typeof vi.fn>).mock.results[0].value
    // eq should not have been called with project_id
    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls.some(([col]: string[]) => col === 'project_id')).toBe(false)
  })
})

describe('GET /api/sync/outbound — errors', () => {
  it('returns 500 when Supabase query fails', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([{ data: null, error: { message: 'connection refused' } }]) as ReturnType<typeof createServiceClient>
    )

    const res = await GET(makeRequest({ table: 'tasks' }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/failed to fetch tasks/i)
  })
})

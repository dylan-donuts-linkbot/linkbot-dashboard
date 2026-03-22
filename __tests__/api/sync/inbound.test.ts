import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockClient } from '../../helpers/supabase-mock'

vi.mock('@/lib/supabase-service', () => ({ createServiceClient: vi.fn() }))

import { createServiceClient } from '@/lib/supabase-service'
import { POST } from '@/app/api/sync/inbound/route'

const VALID_KEY = 'test-key'
const TASK_ID = '00000000-0000-0000-0000-000000000001'
const QUEUE_ID = '00000000-0000-0000-0000-000000000099'

function makeRequest(body: unknown, key = VALID_KEY) {
  return new NextRequest('http://localhost/api/sync/inbound', {
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

describe('POST /api/sync/inbound — auth', () => {
  it('returns 401 with missing key', async () => {
    const req = makeRequest({}, '')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong key', async () => {
    const req = makeRequest({}, 'bad-key')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/sync/inbound — validation', () => {
  beforeEach(() => {
    vi.mocked(createServiceClient).mockReturnValue(createMockClient([]) as ReturnType<typeof createServiceClient>)
  })

  it('returns 400 for invalid table', async () => {
    const res = await POST(makeRequest({ table: 'secrets', operation: 'update', payload: { id: TASK_ID }, idempotency_key: 'k1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/table must be one of/)
  })

  it('returns 400 for invalid operation', async () => {
    const res = await POST(makeRequest({ table: 'tasks', operation: 'truncate', payload: { id: TASK_ID }, idempotency_key: 'k1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/operation must be one of/)
  })

  it('returns 400 when idempotency_key is missing', async () => {
    const res = await POST(makeRequest({ table: 'tasks', operation: 'update', payload: { id: TASK_ID } }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/idempotency_key/)
  })

  it('returns 400 when payload.id is missing', async () => {
    const res = await POST(makeRequest({ table: 'tasks', operation: 'update', payload: { status: 'done' }, idempotency_key: 'k1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/payload\.id/)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/sync/inbound', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-openclaw-api-key': VALID_KEY },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/invalid json/i)
  })
})

describe('POST /api/sync/inbound — idempotency', () => {
  it('returns 200 with duplicate:true and does not re-apply when key already exists', async () => {
    // First from() call (idempotency check) returns an existing queue row
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: { id: QUEUE_ID, record_id: TASK_ID, status: 'processed' }, error: null },
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'tasks',
      operation: 'update',
      payload: { id: TASK_ID, status: 'done' },
      idempotency_key: 'already-seen',
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.duplicate).toBe(true)
    expect(body.record_id).toBe(TASK_ID)
    expect(body.sync_queue_id).toBe(QUEUE_ID)

    // from() was called exactly once (no apply, no status update)
    const { from } = vi.mocked(createServiceClient).mock.results[0].value
    expect(from).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/sync/inbound — happy path', () => {
  it('processes an update and returns success', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: null, error: null },                              // idempotency check → no duplicate
        { data: { id: QUEUE_ID }, error: null },                  // insert sync_queue
        { data: null, error: null },                              // conflict detection: no existing record
        { data: null, error: null },                              // apply update
        { data: null, error: null },                              // mark processed
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'tasks',
      operation: 'update',
      payload: { id: TASK_ID, status: 'done' },
      idempotency_key: 'new-key-1',
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.record_id).toBe(TASK_ID)
    expect(body.sync_queue_id).toBe(QUEUE_ID)
    expect(body.duplicate).toBeUndefined()
  })

  it('processes an insert', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: null, error: null },                              // idempotency check
        { data: { id: QUEUE_ID }, error: null },                  // insert queue (inserts skip conflict check)
        { data: null, error: null },                              // apply insert
        { data: null, error: null },                              // mark processed
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'projects',
      operation: 'insert',
      payload: { id: TASK_ID, name: 'New Project', status: 'active' },
      idempotency_key: 'new-key-2',
    }))

    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })

  it('processes a delete', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: null, error: null },                              // idempotency check
        { data: { id: QUEUE_ID }, error: null },                  // insert queue (deletes skip conflict check)
        { data: null, error: null },                              // apply delete
        { data: null, error: null },                              // mark processed
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'tasks',
      operation: 'delete',
      payload: { id: TASK_ID },
      idempotency_key: 'new-key-3',
    }))

    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })
})

describe('POST /api/sync/inbound — conflict detection', () => {
  it('returns 409 when local modification detected after last sync', async () => {
    const now = new Date().toISOString()
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: null, error: null },                                         // idempotency → miss
        { data: { id: QUEUE_ID }, error: null },                             // insert queue
        // Conflict detection: fetch existing record
        {
          data: {
            id: TASK_ID,
            status: 'in_progress',  // Local modification
            last_synced_at: oneHourAgo,
            updated_at: now,  // Updated more recently than sync time
            sync_source: 'local',
          },
          error: null,
        },
        { data: null, error: null },                                         // mark conflict
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'tasks',
      operation: 'update',
      payload: { id: TASK_ID, status: 'done' },  // Incoming change conflicts
      idempotency_key: 'conflict-key-1',
    }))

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/conflict/i)
    expect(body.conflict).toBe(true)
  })

  it('applies update when no local modifications since last sync', async () => {
    const now = new Date().toISOString()

    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: null, error: null },                                         // idempotency → miss
        { data: { id: QUEUE_ID }, error: null },                             // insert queue
        // Conflict detection: fetch existing record (modified by OpenClaw last)
        {
          data: {
            id: TASK_ID,
            status: 'todo',
            last_synced_at: now,
            updated_at: now,
            sync_source: 'openclaw',
          },
          error: null,
        },
        { data: null, error: null },                                         // apply update
        { data: null, error: null },                                         // mark processed
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'tasks',
      operation: 'update',
      payload: { id: TASK_ID, status: 'done' },
      idempotency_key: 'no-conflict-key-1',
    }))

    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })
})

describe('POST /api/sync/inbound — failure paths', () => {
  it('returns 500 and marks sync_queue failed when apply errors', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: null, error: null },                                         // idempotency → miss
        { data: { id: QUEUE_ID }, error: null },                             // insert queue
        // Conflict detection: no existing record (safe to apply)
        { data: null, error: null },                                         // fetch for conflict check
        { data: null, error: { message: 'column does not exist' } },         // apply → fail
        { data: null, error: null },                                         // mark failed
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'tasks',
      operation: 'update',
      payload: { id: TASK_ID, bad_col: 'x' },
      idempotency_key: 'new-key-4',
    }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/sync operation failed/i)
    expect(body.sync_queue_id).toBe(QUEUE_ID)
  })

  it('returns 500 when sync_queue insert fails', async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createMockClient([
        { data: null, error: null },                                      // idempotency → miss
        { data: null, error: { message: 'unique constraint violated' } }, // queue insert → fail
      ]) as ReturnType<typeof createServiceClient>
    )

    const res = await POST(makeRequest({
      table: 'tasks',
      operation: 'update',
      payload: { id: TASK_ID, status: 'done' },
      idempotency_key: 'new-key-5',
    }))

    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/failed to write sync_queue/i)
  })
})

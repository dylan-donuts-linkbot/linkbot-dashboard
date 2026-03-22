import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-service'
import { validateSyncAuth } from '@/lib/sync-auth'

const ALLOWED_TABLES = ['tasks', 'projects'] as const
type AllowedTable = typeof ALLOWED_TABLES[number]

const ALLOWED_OPERATIONS = ['insert', 'update', 'delete'] as const
type AllowedOperation = typeof ALLOWED_OPERATIONS[number]

export async function POST(request: NextRequest) {
  const authError = validateSyncAuth(request)
  if (authError) return authError

  let body: {
    table: AllowedTable
    operation: AllowedOperation
    payload: Record<string, unknown>
    idempotency_key: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { table, operation, payload, idempotency_key } = body

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `table must be one of: ${ALLOWED_TABLES.join(', ')}` }, { status: 400 })
  }
  if (!operation || !ALLOWED_OPERATIONS.includes(operation)) {
    return NextResponse.json({ error: `operation must be one of: ${ALLOWED_OPERATIONS.join(', ')}` }, { status: 400 })
  }
  if (!idempotency_key) {
    return NextResponse.json({ error: 'idempotency_key is required' }, { status: 400 })
  }
  if (operation !== 'delete' && (!payload || typeof payload !== 'object')) {
    return NextResponse.json({ error: 'payload is required for insert/update' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // ── Idempotency check ──────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('sync_queue')
    .select('id, status, record_id')
    .eq('idempotency_key', idempotency_key)
    .single()

  if (existing) {
    return NextResponse.json({
      success: true,
      record_id: existing.record_id,
      sync_queue_id: existing.id,
      duplicate: true,
    })
  }

  // Derive record_id: use payload.id for insert/update, or require it for delete
  const record_id = (payload?.id as string) ?? null
  if (!record_id) {
    return NextResponse.json({ error: 'payload.id is required to identify the record' }, { status: 400 })
  }

  // ── Write to sync_queue as pending ────────────────────────────────────────
  const { data: queueItem, error: queueError } = await supabase
    .from('sync_queue')
    .insert({
      table_name: table,
      record_id,
      operation,
      payload: payload ?? null,
      status: 'pending',
      source: 'openclaw',
      idempotency_key,
    })
    .select('id')
    .single()

  if (queueError) {
    return NextResponse.json({ error: `Failed to write sync_queue: ${queueError.message}` }, { status: 500 })
  }

  const sync_queue_id = queueItem.id

  // ── Conflict detection (for update operations) ────────────────────────────────
  let hasConflict = false
  if (operation === 'update') {
    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', record_id)
      .single()

    if (!fetchError && existing) {
      // Check if record was modified locally after it was last synced from OpenClaw
      const lastSynced = existing.last_synced_at ? new Date(existing.last_synced_at).getTime() : 0
      const lastModified = existing.updated_at ? new Date(existing.updated_at).getTime() : 0
      const isSyncSource = existing.sync_source === 'openclaw'

      if (!isSyncSource && lastModified > lastSynced) {
        // Local modification detected after last sync from OpenClaw
        // Check if the incoming payload differs from the current state
        const payloadKeys = Object.keys(payload).filter(k => k !== 'id' && k !== 'created_at')
        const hasDifference = payloadKeys.some(key => {
          const incomingVal = (payload as Record<string, unknown>)[key]
          const currentVal = existing[key]
          return JSON.stringify(incomingVal) !== JSON.stringify(currentVal)
        })

        if (hasDifference) {
          hasConflict = true
        }
      }
    }
  }

  if (hasConflict) {
    // Mark as conflict without applying the update
    await supabase
      .from('sync_queue')
      .update({ status: 'failed', error_message: 'Conflict: local modifications detected', processed_at: new Date().toISOString() })
      .eq('id', sync_queue_id)

    return NextResponse.json(
      { error: 'Conflict: local modifications detected', sync_queue_id, conflict: true },
      { status: 409 }
    )
  }

  // ── Apply the operation to the target table ────────────────────────────────
  let applyError: string | null = null

  try {
    if (operation === 'insert') {
      const { error } = await supabase.from(table).insert({ ...payload, sync_source: 'openclaw', last_synced_at: new Date().toISOString(), sync_status: 'synced' })
      if (error) applyError = error.message
    } else if (operation === 'update') {
      const { error } = await supabase.from(table).update({ ...payload, sync_source: 'openclaw', last_synced_at: new Date().toISOString(), sync_status: 'synced' }).eq('id', record_id)
      if (error) applyError = error.message
    } else if (operation === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', record_id)
      if (error) applyError = error.message
    }
  } catch (err) {
    applyError = err instanceof Error ? err.message : String(err)
  }

  // ── Update sync_queue status ───────────────────────────────────────────────
  if (applyError) {
    await supabase
      .from('sync_queue')
      .update({ status: 'failed', error_message: applyError, processed_at: new Date().toISOString() })
      .eq('id', sync_queue_id)

    return NextResponse.json({ error: `Sync operation failed: ${applyError}`, sync_queue_id }, { status: 500 })
  }

  await supabase
    .from('sync_queue')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('id', sync_queue_id)

  return NextResponse.json({ success: true, record_id, sync_queue_id })
}

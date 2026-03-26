import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-service'
import { validateSyncAuth } from '@/lib/sync-auth'

export async function POST(request: NextRequest) {
  const authError = validateSyncAuth(request)
  if (authError) return authError

  let body: {
    project_id?: string
    task_id?: string
    agent: string
    action: string
    summary: string
    status?: string
    metadata?: Record<string, unknown>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { project_id, task_id, agent, action, summary, status, metadata } = body

  if (!agent?.trim()) return NextResponse.json({ error: 'agent is required' }, { status: 400 })
  if (!action?.trim()) return NextResponse.json({ error: 'action is required' }, { status: 400 })
  if (!summary?.trim()) return NextResponse.json({ error: 'summary is required' }, { status: 400 })

  const supabase = createServiceClient()

  // Write to activity_log (primary — has all fields including agent, task_id, status)
  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      agent,
      action,
      summary,
      detail: summary,            // backfill detail for legacy UI compatibility
      status: status ?? null,
      task_id: task_id ?? null,
      project_id: project_id ?? null,
      metadata: metadata ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: `Failed to write activity_log: ${error.message}` }, { status: 500 })
  }

  const log_id = data.id

  // Also write to agent_logs for backward compat with /logs page legacy data
  await supabase.from('agent_logs').insert({
    project_id: project_id ?? null,
    task_id: task_id ?? null,
    agent,
    action,
    summary,
    metadata: metadata ?? null,
  })

  // If task_id provided, update tasks.last_activity_id
  if (task_id) {
    await supabase
      .from('tasks')
      .update({ last_activity_id: log_id })
      .eq('id', task_id)
  }

  return NextResponse.json({ success: true, log_id })
}

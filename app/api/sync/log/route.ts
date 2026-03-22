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
    metadata?: Record<string, unknown>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { project_id, task_id, agent, action, summary, metadata } = body

  if (!agent?.trim()) return NextResponse.json({ error: 'agent is required' }, { status: 400 })
  if (!action?.trim()) return NextResponse.json({ error: 'action is required' }, { status: 400 })
  if (!summary?.trim()) return NextResponse.json({ error: 'summary is required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('agent_logs')
    .insert({
      project_id: project_id ?? null,
      task_id: task_id ?? null,
      agent,
      action,
      summary,
      metadata: metadata ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: `Failed to write agent_log: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, log_id: data.id })
}

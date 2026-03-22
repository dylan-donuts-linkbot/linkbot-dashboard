import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuth } from '@/lib/api-auth'
import { TaskStatus, Priority } from '@/types'

const VALID_STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'in_review', 'done']
const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

// GET /api/tasks
// Query params: ?project_id=uuid  ?assignee=string  ?status=backlog|in_progress|in_review|done
export async function GET(request: NextRequest) {
  const { supabase, unauthorized } = await getRequestAuth()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const project_id = searchParams.get('project_id')
  const assignee = searchParams.get('assignee')
  const status = searchParams.get('status') as TaskStatus | null

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  let query = supabase
    .from('tasks')
    .select('*, project:projects(*)')
    .order('created_at', { ascending: false })

  if (project_id) query = query.eq('project_id', project_id)
  if (assignee) query = query.eq('assignee', assignee)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/tasks
// Body: { title, description?, status?, priority?, project_id?, agent_name?,
//         assignee?, estimated_minutes?, due_date?, instructions?, priority_rank? }
export async function POST(request: NextRequest) {
  const { supabase, unauthorized } = await getRequestAuth()
  if (unauthorized) return unauthorized

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (title.length > 1000) return NextResponse.json({ error: 'title must be 1000 characters or fewer' }, { status: 400 })

  const status = (body.status as TaskStatus) ?? 'backlog'
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const priority = (body.priority as Priority) ?? 'medium'
  if (!VALID_PRIORITIES.includes(priority)) {
    return NextResponse.json(
      { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title,
      status,
      priority,
      description: body.description ?? null,
      project_id: body.project_id ?? null,
      agent_name: body.agent_name ?? null,
      assignee: body.assignee ?? null,
      estimated_minutes: body.estimated_minutes ?? null,
      due_date: body.due_date ?? null,
      instructions: body.instructions ?? null,
      priority_rank: body.priority_rank ?? null,
      created_at: now,
      updated_at: now,
    }])
    .select('*, project:projects(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}

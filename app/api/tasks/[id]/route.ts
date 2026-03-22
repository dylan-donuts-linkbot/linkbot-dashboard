import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuth } from '@/lib/api-auth'
import { TaskStatus, Priority } from '@/types'

const VALID_STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'in_review', 'done']
const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/tasks/[id]
// Body: any subset of task fields (id, created_at are ignored)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { supabase, unauthorized } = await getRequestAuth()
  if (unauthorized) return unauthorized

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate fields present in the body
  if ('title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 })
    if (title.length > 1000) return NextResponse.json({ error: 'title must be 1000 characters or fewer' }, { status: 400 })
    body.title = title
  }

  if ('status' in body && !VALID_STATUSES.includes(body.status as TaskStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  if ('priority' in body && !VALID_PRIORITIES.includes(body.priority as Priority)) {
    return NextResponse.json(
      { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
      { status: 400 }
    )
  }

  // Strip read-only fields
  const { id: _id, created_at: _ca, project: _p, ...updates } = body as Record<string, unknown>
  void _id; void _ca; void _p

  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, project:projects(*)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// DELETE /api/tasks/[id]
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { supabase, unauthorized } = await getRequestAuth()
  if (unauthorized) return unauthorized

  const { id } = await params

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuth } from '@/lib/api-auth'
import { ProjectStatus } from '@/types'

const VALID_STATUSES: ProjectStatus[] = ['active', 'paused', 'archived', 'complete']

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/projects/[id]
// Body: any subset of project fields (id and created_at are ignored)
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
  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    if (name.length > 500) return NextResponse.json({ error: 'name must be 500 characters or fewer' }, { status: 400 })
    body.name = name
  }

  if ('status' in body && !VALID_STATUSES.includes(body.status as ProjectStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // Strip read-only fields
  const { id: _id, created_at: _ca, ...updates } = body as Record<string, unknown>
  void _id; void _ca

  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// DELETE /api/projects/[id]
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { supabase, unauthorized } = await getRequestAuth()
  if (unauthorized) return unauthorized

  const { id } = await params

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}

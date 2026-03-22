import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuth } from '@/lib/api-auth'
import { ProjectStatus } from '@/types'

const VALID_STATUSES: ProjectStatus[] = ['active', 'paused', 'archived', 'complete']

// GET /api/projects
// Query params: ?status=active|paused|archived|complete
export async function GET(request: NextRequest) {
  const { supabase, unauthorized } = await getRequestAuth()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as ProjectStatus | null

  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/projects
// Body: { name, color, description?, status?, github_repo?, vercel_project?,
//         live_url?, stage?, prd_content?, prd_url?, assignees? }
export async function POST(request: NextRequest) {
  const { supabase, unauthorized } = await getRequestAuth()
  if (unauthorized) return unauthorized

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const color = typeof body.color === 'string' ? body.color.trim() : ''

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!color) return NextResponse.json({ error: 'color is required' }, { status: 400 })
  if (name.length > 500) return NextResponse.json({ error: 'name must be 500 characters or fewer' }, { status: 400 })

  const status = (body.status as ProjectStatus) ?? 'active'
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      name,
      color,
      status,
      description: body.description ?? null,
      github_repo: body.github_repo ?? null,
      vercel_project: body.vercel_project ?? null,
      live_url: body.live_url ?? null,
      stage: body.stage ?? null,
      prd_content: body.prd_content ?? null,
      prd_url: body.prd_url ?? null,
      assignees: Array.isArray(body.assignees) ? body.assignees : [],
      created_at: now,
      updated_at: now,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}

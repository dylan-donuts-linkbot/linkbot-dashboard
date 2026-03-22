import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-service'
import { validateSyncAuth } from '@/lib/sync-auth'

const ALLOWED_TABLES = ['tasks', 'projects'] as const
type AllowedTable = typeof ALLOWED_TABLES[number]

export async function GET(request: NextRequest) {
  const authError = validateSyncAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table') as AllowedTable | null
  const project_id = searchParams.get('project_id')
  const since = searchParams.get('since')

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `table query param must be one of: ${ALLOWED_TABLES.join(', ')}` }, { status: 400 })
  }

  if (since && isNaN(Date.parse(since))) {
    return NextResponse.json({ error: 'since must be a valid ISO timestamp' }, { status: 400 })
  }

  const supabase = createServiceClient()

  let query = supabase
    .from(table)
    .select('*, sync_status, last_synced_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  if (since) {
    query = query.gte('updated_at', since)
  }

  if (project_id && table === 'tasks') {
    query = query.eq('project_id', project_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: `Failed to fetch ${table}: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ data, count: data?.length ?? 0 })
}

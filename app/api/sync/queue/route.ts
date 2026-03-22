import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-service'
import { validateSyncAuth } from '@/lib/sync-auth'

const ALLOWED_STATUSES = ['pending', 'processed', 'failed'] as const
type AllowedStatus = typeof ALLOWED_STATUSES[number]

export async function GET(request: NextRequest) {
  const authError = validateSyncAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as AllowedStatus | null

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  let query = supabase
    .from('sync_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: `Failed to fetch sync_queue: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ data, count: data?.length ?? 0 })
}

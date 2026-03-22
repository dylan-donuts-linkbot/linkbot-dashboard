import { createServerClient } from './supabase-server'
import { NextResponse } from 'next/server'

/**
 * Validates the session from the request cookies.
 * Returns { supabase, user } on success.
 * Returns { supabase, user: null, unauthorized } when no valid session exists —
 * callers should return the `unauthorized` response immediately.
 */
export async function getRequestAuth() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const
  }

  return { supabase, user, unauthorized: null } as const
}

import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ─── Server client (server components + server actions) ──────────────────────
// Must be called with await; reads/writes auth session cookies from the request.
export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Supabase environment variables not configured')

  const cookieStore = await cookies()
  return _createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
}

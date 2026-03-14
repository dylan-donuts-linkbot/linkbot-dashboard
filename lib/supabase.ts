import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your_supabase_url') return null
  if (!_client) {
    _client = createClient(url, key)
  }
  return _client
}

// Server-side client (for server components and server actions)
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  return createClient(url, key)
}

// Convenience re-export for client components
export const supabase = {
  from: (table: string) => {
    const client = getSupabase()
    if (!client) {
      // Return a no-op chain so unchecked calls don't crash
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const noop: any = new Proxy({}, { get: () => noop })
      return noop
    }
    return client.from(table)
  },
}

import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const isConfigured = !!(url && anonKey && url !== 'your_supabase_url')

// ─── Browser client (client components) ─────────────────────────────────────
// Singleton — reused across renders, includes auth session from cookies.
let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase(): ReturnType<typeof createBrowserClient> | null {
  if (!isConfigured) return null
  if (!_browserClient) {
    _browserClient = createBrowserClient(url, anonKey)
  }
  return _browserClient
}

// ─── Convenience proxy for client components ─────────────────────────────────
// Falls back to a no-op chain when Supabase is not configured (demo mode).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noop: any = new Proxy({}, { get: () => noop })

export const supabase = {
  from: (table: string) => {
    const client = getSupabase()
    if (!client) return noop
    return client.from(table)
  },
}

import { createClient } from '@supabase/supabase-js'

/**
 * Service role Supabase client — bypasses RLS entirely.
 * Use only in server-side API routes that authenticate via their own mechanism
 * (e.g. OPENCLAW_API_KEY). Never expose this to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

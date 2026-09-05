import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// In development, warn instead of crashing if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[WorthIt] Missing Supabase environment variables. ' +
    'Copy .env.example to .env and fill in your Supabase project URL and anon key. ' +
    'The app will load but data features won\'t work.'
  )
}

/**
 * Bridge between the module-level Supabase client and the React-level Clerk
 * session. The AuthProvider calls setClerkTokenGetter() after mount to inject
 * the live Clerk session.getToken function. The Supabase client's accessToken
 * callback invokes it on every request, sending the Clerk JWT as the bearer
 * token so Supabase can validate it via its native Third-Party Auth integration.
 *
 * When the getter is null (signed out / not yet loaded), the callback returns
 * null and the request falls back to the anon key — exactly what we want for
 * public reads (items, ratings).
 */
let _getClerkToken: (() => Promise<string | null>) | null = null

export function setClerkTokenGetter(getter: (() => Promise<string | null>) | null) {
  _getClerkToken = getter
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'placeholder',
  {
    accessToken: async () => {
      if (!_getClerkToken) return null
      return (await _getClerkToken()) ?? null
    },
  },
)

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// In development, warn instead of crashing if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[TuckRate] Missing Supabase environment variables. ' +
    'Copy .env.example to .env and fill in your Supabase project URL and anon key. ' +
    'The app will load but data features won\'t work.'
  )
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'placeholder')

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

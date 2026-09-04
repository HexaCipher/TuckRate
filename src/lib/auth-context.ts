import { createContext, useContext } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextValue {
  user: SupabaseUser | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export { AuthContext }
export type { AuthContextValue }

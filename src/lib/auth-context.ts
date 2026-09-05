import { createContext, useContext } from 'react'

/**
 * Minimal user shape exposed to the rest of the app. Maps to both
 * the old SupabaseUser contract (user.id, user.email) and the new
 * Clerk contract (userId, primaryEmailAddress).
 */
export interface AuthUser {
  id: string
  email: string | undefined
}

export interface AuthContextValue {
  user: AuthUser | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export { AuthContext }

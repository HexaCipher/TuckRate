import { useCallback, useEffect, type ReactNode } from 'react'
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from '@clerk/clerk-react'
import { IconLoader2 } from '@tabler/icons-react'
import { setClerkTokenGetter } from './supabase'
import { AuthContext } from './auth-context'
import { useEnsureProfile } from '../hooks/useEnsureProfile'

/**
 * Auth provider powered by Clerk.
 *
 * Responsibilities:
 * 1. Bridges the Clerk session token to the Supabase client via setClerkTokenGetter.
 * 2. Ensures a public.users row exists for the Clerk user (replaces the old trigger).
 * 3. Exposes the same AuthContext shape ({user, signOut}) that all consumers expect.
 * 4. Shows splash loading / error states per docs/3-App-Flow.md §1.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    isLoaded,
    isSignedIn,
    userId,
    getToken,
    signOut: clerkSignOut,
  } = useClerkAuth()

  const { user: clerkUser } = useClerkUser()

  // Bridge Clerk token → Supabase client
  useEffect(() => {
    if (isSignedIn) {
      setClerkTokenGetter(() => getToken())
    } else {
      setClerkTokenGetter(null)
    }
    return () => setClerkTokenGetter(null)
  }, [isSignedIn, getToken])

  // Ensure public.users row exists for this Clerk user
  useEnsureProfile(isSignedIn ? userId : null)

  const signOut = useCallback(async () => {
    await clerkSignOut()
  }, [clerkSignOut])

  // Splash loading state (docs/3-App-Flow.md §1)
  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <IconLoader2 size={28} className="animate-spin text-secondary" />
      </div>
    )
  }

  // Map Clerk user to the app's AuthUser shape
  const user = isSignedIn && userId
    ? {
        id: userId,
        email: clerkUser?.primaryEmailAddress?.emailAddress,
      }
    : null

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

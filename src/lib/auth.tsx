import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { IconLoader2 } from '@tabler/icons-react'
import { supabase } from './supabase'
import { AuthContext } from './auth-context'

/**
 * Global auth state.
 * - On load: silent session check (docs/3-App-Flow.md §1 splash) while a simple
 *   spinner shows. Session persistence/refresh itself is handled by supabase-js
 *   (localStorage), so a refresh keeps the user logged in.
 * - onAuthStateChange keeps React state in sync for sign-in/out/refresh events.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [initFailed, setInitFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!cancelled) {
          setUser(data.session?.user ?? null)
          setInitializing(false)
        }
      } catch {
        if (!cancelled) {
          setInitFailed(true)
          setInitializing(false)
        }
      }
    }

    checkSession()

    // Keep state in sync (SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / USER_UPDATED).
    // Callback stays light (setState only) — supabase-js warns about deadlocks otherwise.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [attempt])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const retryInit = useCallback(() => {
    setInitFailed(false)
    setInitializing(true)
    setAttempt((n) => n + 1)
  }, [])

  // Splash loading state (docs/3-App-Flow.md §1): simple centered spinner
  if (initializing) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <IconLoader2 size={28} className="animate-spin text-secondary" />
      </div>
    )
  }

  // Splash error state (docs/3-App-Flow.md §1): never block indefinitely
  if (initFailed) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-secondary mb-4">
          Couldn&apos;t connect. Check your internet and retry.
        </p>
        <button
          type="button"
          onClick={retryInit}
          className="h-12 px-6 rounded-full bg-accent text-accent-dark text-sm font-medium active:bg-accent-hover"
        >
          Retry
        </button>
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>
}

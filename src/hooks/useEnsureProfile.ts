import { useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Ensures a `public.users` row exists for the signed-in Clerk user.
 *
 * With Supabase Auth, the `on_auth_user_created` trigger auto-created this row.
 * Since Clerk users are never written to `auth.users`, we do it client-side on
 * every app load for signed-in users. The insert is idempotent (the RLS insert
 * policy + unique PK on id prevents duplicates; we catch 23505 gracefully).
 *
 * Called from the AuthProvider — not a TanStack Query hook, because it's a
 * fire-and-forget side effect, not data the UI renders from.
 */
export function useEnsureProfile(userId: string | null) {
  const didRun = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || didRun.current === userId) return
    didRun.current = userId

    async function ensure() {
      try {
        // Check if profile exists
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId!)
          .maybeSingle()

        if (data) return // row already exists

        // Insert new profile row
        const { error } = await supabase
          .from('users')
          .insert({ id: userId })

        if (error) {
          // 23505 = unique_violation — another tab/request created it first
          if (error.code === '23505') return
          console.warn('[WorthIt] Could not create profile row:', error.message)
        }
      } catch (err) {
        console.warn('[WorthIt] Profile provisioning failed:', err)
      }
    }

    void ensure()
  }, [userId])
}

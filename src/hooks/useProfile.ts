import { useQuery } from '@tanstack/react-query'
import type { User as DbUser } from '../types/database'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'

/**
 * The signed-in user's public.users profile row (room_number, is_banned, is_admin).
 * The row is auto-created by the on_auth_user_created trigger at signup.
 * Used for the Profile screen now; is_admin gating (Admin view) arrives in Phase 5.
 */
export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<DbUser> => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data as DbUser
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  })
}

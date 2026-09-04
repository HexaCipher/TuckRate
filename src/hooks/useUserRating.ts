import { useQuery } from '@tanstack/react-query'
import type { Rating } from '../types/database'
import { supabase } from '../lib/supabase'

/**
 * Fetch the current user's existing rating for a specific item.
 * Used to pre-fill the Rate & Review form when editing.
 * Returns null if no rating exists (first-time rating).
 */
export function useUserRating(userId: string | undefined, itemId: string | undefined) {
  return useQuery({
    queryKey: ['user-rating', userId, itemId],
    queryFn: async (): Promise<Rating | null> => {
      if (!userId || !itemId) return null

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle()

      if (error) throw error
      return (data as Rating) ?? null
    },
    enabled: Boolean(userId && itemId),
  })
}

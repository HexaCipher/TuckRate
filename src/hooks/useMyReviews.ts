import { useQuery } from '@tanstack/react-query'
import type { RatingWithItem } from '../types/database'
import { supabase } from '../lib/supabase'

/**
 * Fetch all ratings submitted by the specified user, joined with basic item info.
 * Used on the Profile screen (docs/3-App-Flow.md §6).
 * Sorted by created_at desc (most recent first).
 */
export function useMyReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-reviews', userId],
    queryFn: async (): Promise<RatingWithItem[]> => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('ratings')
        .select('*, item:items(id, name, price, category, photo_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as RatingWithItem[]
    },
    enabled: Boolean(userId),
  })
}

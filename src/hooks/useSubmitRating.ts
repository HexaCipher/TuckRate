import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface SubmitRatingPayload {
  itemId: string
  userId: string
  stars: number
  worthIt: boolean
  reviewText: string | null
  hygieneFlag: boolean
}

/**
 * Mutation hook for upserting a rating (insert or update on conflict).
 * Uses the unique(user_id, item_id) constraint to determine insert vs update.
 * On success, invalidates item-detail, items, and my-reviews queries so UI
 * reflects the change immediately.
 */
export function useSubmitRating(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SubmitRatingPayload) => {
      const { data, error } = await supabase
        .from('ratings')
        .upsert(
          {
            user_id: payload.userId,
            item_id: payload.itemId,
            stars: payload.stars,
            worth_it: payload.worthIt,
            review_text: payload.reviewText || null,
            hygiene_flag: payload.hygieneFlag,
          },
          { onConflict: 'user_id,item_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate related queries so the new/updated rating is visible immediately
      void queryClient.invalidateQueries({ queryKey: ['item-detail', itemId] })
      void queryClient.invalidateQueries({ queryKey: ['items'] })
      void queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
    },
  })
}

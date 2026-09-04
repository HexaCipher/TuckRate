import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Report } from '../types/database'

interface SubmitReportPayload {
  ratingId: string
  reportedBy: string
  reason: Report['reason']
  comment?: string | null
}

/**
 * Mutation hook for submitting a flag/report on a review (docs/3-App-Flow.md §8).
 * Enforces authenticated submission and catches duplicate report attempts.
 */
export function useSubmitReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SubmitReportPayload) => {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          rating_id: payload.ratingId,
          reported_by: payload.reportedBy,
          reason: payload.reason,
          comment: payload.comment?.trim() || null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        // Handle unique constraint (unique (rating_id, reported_by))
        if (error.code === '23505') {
          throw new Error('You have already reported this review.')
        }
        throw error
      }

      return data
    },
    onSuccess: () => {
      // Invalidate admin reports query in case an admin is reviewing
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

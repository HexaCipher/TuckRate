import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ReportWithDetails } from '../types/database'

/**
 * Fetch all pending reports joined with rating, item, author, and reporter details.
 * Used exclusively on the Admin moderation screen (docs/3-App-Flow.md §9).
 * RLS enforces admin-only access.
 */
export function useReports(isAdmin: boolean) {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async (): Promise<ReportWithDetails[]> => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          rating:ratings (
            *,
            item:items (id, name, price),
            author:users!ratings_user_id_fkey (id, room_number)
          ),
          reporter:users!reports_reported_by_fkey (id, room_number)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as unknown as ReportWithDetails[]
    },
    enabled: isAdmin,
  })
}

/**
 * Admin action: Dismiss report without modifying the review.
 * Marks the report status as 'dismissed'.
 */
export function useDismissReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
        .eq('id', reportId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

/**
 * Admin action: Remove review.
 * Deletes the flagged rating from public.ratings and marks report resolved.
 */
export function useRemoveReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reportId, ratingId }: { reportId: string; ratingId: string }) => {
      // 1. Delete the rating (cascade will delete or we update status)
      const { error: ratingError } = await supabase
        .from('ratings')
        .delete()
        .eq('id', ratingId)

      if (ratingError) throw ratingError

      // 2. Best-effort update of report status if not cascade-deleted
      await supabase
        .from('reports')
        .update({ status: 'removed', resolved_at: new Date().toISOString() })
        .eq('id', reportId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      void queryClient.invalidateQueries({ queryKey: ['items'] })
      void queryClient.invalidateQueries({ queryKey: ['item-detail'] })
    },
  })
}

/**
 * Admin action: Ban user.
 * Invokes the security definer RPC admin_ban_user, blocking future contributions,
 * and dismisses the report.
 */
export function useBanUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reportId, userId }: { reportId: string; userId: string }) => {
      // 1. Call admin_ban_user RPC
      const { error: banError } = await supabase.rpc('admin_ban_user', {
        target_user_id: userId,
      })

      if (banError) throw banError

      // 2. Mark report dismissed
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
        .eq('id', reportId)

      if (reportError) throw reportError
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

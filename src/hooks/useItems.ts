import { useQuery } from '@tanstack/react-query'
import type { ItemStats } from '../types/database'
import { supabase } from '../lib/supabase'

/**
 * Fetch aggregated item stats from the item_stats Postgres view.
 * Public data — no auth required, always enabled (browse-first per PRD).
 * Returns items sorted by avg_stars desc (default "top rated" per App Flow §2).
 */
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async (): Promise<ItemStats[]> => {
      const { data, error } = await supabase
        .from('item_stats')
        .select('*')
        .order('avg_stars', { ascending: false })
      if (error) throw error
      return (data ?? []) as ItemStats[]
    },
  })
}

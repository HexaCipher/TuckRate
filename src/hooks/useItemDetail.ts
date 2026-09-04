import { useQuery } from '@tanstack/react-query'
import type { Item, RatingWithUser } from '../types/database'
import { supabase } from '../lib/supabase'

interface ItemDetail {
  item: Item
  ratings: RatingWithUser[]
  totalCount: number
  avgStars: number
  worthItPct: number
  hygieneCount: number
}

/**
 * Fetch a single item + all its ratings (with reviewer info) for the
 * Item Detail screen (docs/3-App-Flow.md §3). Public data — no auth required.
 *
 * Ratings are sorted most-recent-first. Each rating includes the reviewer's
 * room_number (trust signal) via Supabase's embedded select.
 */
export function useItemDetail(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item-detail', itemId],
    queryFn: async (): Promise<ItemDetail> => {
      if (!itemId) throw new Error('Missing item ID')

      // Fetch item and ratings in parallel
      const [itemRes, ratingsRes] = await Promise.all([
        supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .single(),
        supabase
          .from('ratings')
          .select('*, user:users(id, room_number)')
          .eq('item_id', itemId)
          .order('created_at', { ascending: false }),
      ])

      if (itemRes.error) throw itemRes.error
      if (ratingsRes.error) throw ratingsRes.error

      const item = itemRes.data as Item
      const ratings = (ratingsRes.data ?? []) as RatingWithUser[]

      // Compute aggregates client-side from the full ratings set
      const totalCount = ratings.length
      const avgStars = totalCount > 0
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / totalCount
        : 0
      const worthItCount = ratings.filter(r => r.worth_it).length
      const worthItPct = totalCount > 0
        ? Math.round((worthItCount / totalCount) * 100)
        : 0
      const hygieneCount = ratings.filter(r => r.hygiene_flag).length

      return { item, ratings, totalCount, avgStars, worthItPct, hygieneCount }
    },
    enabled: Boolean(itemId),
  })
}

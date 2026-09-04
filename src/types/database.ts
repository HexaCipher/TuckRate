// TypeScript types matching the Supabase database schema
// See docs/5-Backend-Schema.md for full table definitions

export interface User {
  id: string
  room_number: string | null
  is_banned: boolean
  is_admin: boolean
  created_at: string
}

export interface Item {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  photo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  user_id: string
  item_id: string
  stars: number // 1–5
  worth_it: boolean
  review_text: string | null
  hygiene_flag: boolean
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  rating_id: string
  reported_by: string
  reason: 'fake_spam' | 'offensive' | 'unrelated' | 'other'
  comment: string | null
  status: 'pending' | 'dismissed' | 'removed'
  created_at: string
  resolved_at: string | null
}

// Computed view — aggregated stats per item (from item_stats Postgres view)
export interface ItemStats {
  id: string
  name: string
  price: number
  category: string | null
  photo_url: string | null
  is_active: boolean
  rating_count: number
  avg_stars: number
  worth_it_count: number
  worth_it_pct: number
  hygiene_flag_count: number
}

// Rating joined with user info for display in reviews list
export interface RatingWithUser extends Rating {
  user: Pick<User, 'id' | 'room_number'> | null
  user_rating_count?: number
}

// Rating joined with item info for display in profile my reviews list
export interface RatingWithItem extends Rating {
  item: Pick<Item, 'id' | 'name' | 'price' | 'category' | 'photo_url'> | null
}

// Report joined with rating, item, author, and reporter for moderation view
export interface ReportWithDetails extends Report {
  rating: (Rating & {
    item: Pick<Item, 'id' | 'name' | 'price'> | null
    author: Pick<User, 'id' | 'room_number'> | null
  }) | null
  reporter: Pick<User, 'id' | 'room_number'> | null
}

// Badge type derived from worth_it_pct
export type WorthItStatus = 'worth_it' | 'skip_it' | 'mixed' | 'not_enough'

// Constants for badge thresholds
export const BADGE_THRESHOLDS = {
  WORTH_IT_MIN_PCT: 70,  // ≥70% → "Worth it" (green)
  SKIP_IT_MAX_PCT: 30,   // ≤30% → "Skip it" (red)
  MIN_RATINGS: 3,         // Need at least 3 ratings to show a badge
} as const

// Helper to determine badge status
export function getWorthItStatus(worthItPct: number, ratingCount: number): WorthItStatus {
  if (ratingCount < BADGE_THRESHOLDS.MIN_RATINGS) return 'not_enough'
  if (worthItPct >= BADGE_THRESHOLDS.WORTH_IT_MIN_PCT) return 'worth_it'
  if (worthItPct <= BADGE_THRESHOLDS.SKIP_IT_MAX_PCT) return 'skip_it'
  return 'mixed'
}

// Filter types for Home screen
export type FilterOption = 'top_rated' | 'under_50' | 'worth_it' | 'all'

// Report reason display labels
export const REPORT_REASONS: Record<Report['reason'], string> = {
  fake_spam: 'Fake / Spam',
  offensive: 'Offensive',
  unrelated: 'Unrelated to food',
  other: 'Other',
} as const

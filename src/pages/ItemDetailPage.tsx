import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft,
  IconAlertTriangle,
  IconStarFilled,
  IconFlag,
} from '@tabler/icons-react'
import StarRating from '../components/StarRating'
import WorthItBadge from '../components/WorthItBadge'
import { useItemDetail } from '../hooks/useItemDetail'
import { useAuth } from '../lib/auth-context'
import type { RatingWithUser } from '../types/database'

/** Format a date string as "Sep 4, 2026" */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ReviewCard({ rating }: { rating: RatingWithUser }) {
  return (
    <div className="py-4 border-b border-border-subtle last:border-b-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <StarRating rating={rating.stars} />
          <WorthItBadge worthItPct={rating.worth_it ? 100 : 0} ratingCount={1} />
        </div>
        {/* Report icon — wired in Phase 5 */}
        <button
          type="button"
          aria-label="Report this review"
          className="w-8 h-8 flex items-center justify-center text-muted active:text-secondary"
        >
          <IconFlag size={16} stroke={1.75} />
        </button>
      </div>

      {rating.review_text && (
        <p className="text-sm text-primary mb-1.5">{rating.review_text}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted">
        {rating.user?.room_number && (
          <span>Room {rating.user.room_number}</span>
        )}
        <span>{formatDate(rating.created_at)}</span>
      </div>
    </div>
  )
}

/**
 * Item Detail screen (docs/3-App-Flow.md §3).
 * All four states: success, loading, empty (no reviews), error.
 * Sticky "Rate this item" CTA at bottom — auth-gated.
 */
function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useItemDetail(id)

  function handleRate() {
    if (!user) {
      // Auth-gated: redirect to login, then return here (docs/3-App-Flow.md §3)
      navigate('/login', { state: { from: `/item/${id}` } })
    } else {
      navigate(`/item/${id}/rate`)
    }
  }

  // Check if the current user already has a rating for this item
  const userRating = data?.ratings.find(r => r.user_id === user?.id)

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-dvh flex flex-col">
      {/* Header: back arrow + item name */}
      <header className="flex items-center gap-3 px-4 h-14 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full text-secondary active:text-primary active:bg-card transition-colors"
        >
          <IconArrowLeft size={22} stroke={1.75} />
        </button>
        <h1 className="text-base font-medium text-primary truncate">
          {data?.item.name ?? 'Item detail'}
        </h1>
      </header>

      {/* Loading state: skeletons */}
      {isLoading && (
        <div className="flex-1 px-4 py-6 animate-pulse space-y-6">
          {/* Rating hero skeleton */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-20 rounded bg-elevated" />
            <div className="h-4 w-32 rounded bg-elevated" />
            <div className="h-6 w-24 rounded-full bg-elevated" />
          </div>
          {/* Reviews skeleton */}
          <div className="space-y-4 pt-4 border-t border-border-subtle">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-elevated" />
                <div className="h-3 w-full rounded bg-elevated" />
                <div className="h-3 w-2/3 rounded bg-elevated" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-sm text-secondary mb-4">
            Couldn&apos;t load this item. Check your internet and try again.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="h-11 px-6 rounded-full bg-accent text-card text-sm font-medium active:bg-accent-hover shadow-warm cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success state */}
      {data && !isLoading && !isError && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-24">
            {/* Item info */}
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-secondary">{data.item.category ?? 'Menu item'}</span>
              <span className="text-base font-medium text-primary">₹{Number(data.item.price)}</span>
            </div>

            {/* Rating hero area */}
            <div className="flex flex-col items-center py-6">
              <StarRating rating={data.avgStars} size="lg" />
              <p className="text-sm text-secondary mt-1">
                {data.totalCount > 0
                  ? `${data.totalCount} rating${data.totalCount !== 1 ? 's' : ''}`
                  : 'Not yet rated'}
              </p>

              {/* Worth it percentage */}
              {data.totalCount > 0 && (
                <p className="text-sm text-secondary mt-2">
                  <span className="text-good font-medium">{data.worthItPct}%</span> say worth it
                </p>
              )}

              <div className="mt-2">
                <WorthItBadge worthItPct={data.worthItPct} ratingCount={data.totalCount} />
              </div>
            </div>

            {/* Hygiene flag banner (docs/3-App-Flow.md §3: red, prominent, only if any) */}
            {data.hygieneCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-bad-bg border border-bad/20">
                <IconAlertTriangle size={18} className="text-bad shrink-0" />
                <p className="text-xs text-bad">
                  {data.hygieneCount} hygiene {data.hygieneCount === 1 ? 'issue' : 'issues'} reported
                </p>
              </div>
            )}

            {/* Reviews list */}
            <div className="border-t border-border-subtle">
              <h2 className="text-sm font-medium text-primary pt-4 pb-2">
                Reviews
              </h2>

              {/* Empty reviews state */}
              {data.ratings.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-secondary mb-2">No reviews yet — be the first.</p>
                </div>
              )}

              {/* Review cards */}
              {data.ratings.map(rating => (
                <ReviewCard key={rating.id} rating={rating} />
              ))}
            </div>
          </div>

          {/* Sticky bottom CTA: "Rate this item" or "Edit your rating" */}
          <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-gradient-to-t from-app via-app to-transparent">
            <div className="max-w-[430px] mx-auto">
              <button
                type="button"
                onClick={handleRate}
                className="w-full h-12 rounded-full bg-accent text-card text-sm font-semibold active:bg-accent-hover shadow-warm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <IconStarFilled size={16} />
                {userRating ? 'Edit your rating' : 'Rate this item'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Back nav always available even on error (docs/3-App-Flow.md §3) — header handles this */}
    </div>
  )
}

export default ItemDetailPage

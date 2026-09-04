import { Navigate, useNavigate } from 'react-router-dom'
import {
  IconBed,
  IconLogout,
  IconStarFilled,
  IconChevronRight,
  IconAlertTriangle,
  IconNotes,
} from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'
import { useProfile } from '../hooks/useProfile'
import { useMyReviews } from '../hooks/useMyReviews'
import StarRating from '../components/StarRating'
import WorthItBadge from '../components/WorthItBadge'
import type { RatingWithItem } from '../types/database'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function UserReviewCard({ review }: { review: RatingWithItem }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/item/${review.item_id}`)}
      className="w-full text-left p-4 rounded-2xl bg-card border border-border-subtle shadow-warm hover:border-border-default active:scale-[0.99] active:bg-elevated transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-secondary font-medium uppercase tracking-wide">
            {review.item?.category ?? 'Menu item'}
          </p>
          <h3 className="text-sm font-semibold text-primary truncate">
            {review.item?.name ?? 'Unknown item'}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-secondary shrink-0">
          <span className="text-xs font-semibold tabular-nums text-primary">
            ₹{Number(review.item?.price ?? 0)}
          </span>
          <IconChevronRight size={16} className="text-muted" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <StarRating rating={review.stars} />
        <WorthItBadge worthItPct={review.worth_it ? 100 : 0} ratingCount={1} />
      </div>

      {review.review_text && (
        <p className="text-xs text-primary/90 line-clamp-2 mb-2 leading-relaxed bg-app/50 p-2.5 rounded-xl border border-border-subtle">
          &ldquo;{review.review_text}&rdquo;
        </p>
      )}

      {review.hygiene_flag && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-bad mb-2">
          <IconAlertTriangle size={13} className="shrink-0" />
          <span>Reported hygiene issue</span>
        </div>
      )}

      <p className="text-[11px] text-muted">
        Rated on {formatDate(review.created_at)}
      </p>
    </button>
  )
}

/**
 * Profile screen (docs/3-App-Flow.md §6).
 * Profile information + My Reviews list.
 * Supports public review history and all four states.
 */
function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const profile = useProfile()
  const {
    data: reviews,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    refetch: refetchReviews,
  } = useMyReviews(user?.id)

  // Auth-gated: redirect to Login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/profile' }} />
  }

  const email = user.email ?? 'Signed in'
  const reviewCount = reviews?.length ?? 0

  async function handleLogout() {
    navigate('/', { replace: true })
    try {
      await signOut()
    } catch (err) {
      console.warn('[TuckRate] Logout failed:', err)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col px-4 py-8 w-full max-w-[430px] mx-auto text-primary">
      {/* Header */}
      <h1 className="text-lg font-semibold text-primary mb-6">Profile</h1>

      {/* User Info Card */}
      <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-card border border-border-subtle shadow-warm mb-6">
        <div className="w-16 h-16 rounded-full bg-accent-light/40 border border-accent/20 flex items-center justify-center mb-3">
          <span className="text-2xl font-semibold text-accent uppercase">
            {email.charAt(0)}
          </span>
        </div>
        <p className="text-sm font-medium text-primary break-all">{email}</p>

        {/* Room number from public.users */}
        {profile.isLoading && (
          <div className="h-6 w-24 rounded-full bg-elevated mt-2 animate-pulse" />
        )}

        {profile.isError && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-bad">
            <span>Couldn&apos;t load room</span>
            <button
              type="button"
              onClick={() => void profile.refetch()}
              className="text-accent underline font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {profile.isSuccess && (
          <div className="mt-2.5 flex items-center gap-2">
            {profile.data.room_number ? (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-elevated text-xs font-medium text-secondary">
                <IconBed size={14} />
                Room {profile.data.room_number}
              </span>
            ) : (
              <span className="text-xs text-muted">No room number set</span>
            )}

            {/* Contribution Count Badge */}
            <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-accent-light text-accent-dark text-xs font-semibold">
              <IconStarFilled size={12} />
              <span>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
            </span>
          </div>
        )}
      </div>

      {/* My Reviews Section */}
      <section className="flex-1 flex flex-col mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-primary">My Reviews</h2>
          <span className="text-xs text-secondary">
            {reviews ? `${reviewCount} total` : ''}
          </span>
        </div>

        {/* Loading State */}
        {isReviewsLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-card border border-border-subtle animate-pulse space-y-2.5"
              >
                <div className="h-4 w-32 rounded bg-elevated" />
                <div className="h-4 w-20 rounded bg-elevated" />
                <div className="h-3 w-48 rounded bg-elevated" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isReviewsError && !isReviewsLoading && (
          <div className="p-6 text-center rounded-2xl bg-card border border-border-subtle shadow-warm">
            <p className="text-xs text-bad mb-3 font-medium">
              Couldn&apos;t load your reviews.
            </p>
            <button
              type="button"
              onClick={() => void refetchReviews()}
              className="h-9 px-4 rounded-full bg-accent text-card text-xs font-semibold cursor-pointer shadow-warm active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isReviewsLoading && !isReviewsError && reviews && reviews.length === 0 && (
          <div className="p-8 text-center rounded-3xl bg-card border border-border-subtle shadow-warm my-auto">
            <div className="w-12 h-12 rounded-2xl bg-app border border-border-subtle flex items-center justify-center mx-auto mb-3 text-secondary">
              <IconNotes size={24} stroke={1.5} />
            </div>
            <p className="text-sm font-semibold text-primary mb-1">
              You haven&apos;t rated anything yet.
            </p>
            <p className="text-xs text-secondary mb-4 max-w-xs mx-auto">
              Share your opinion on tuck shop items to help other students decide.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="h-10 px-5 rounded-full bg-accent text-card text-xs font-semibold cursor-pointer shadow-warm active:scale-95 transition-all"
            >
              Browse menu
            </button>
          </div>
        )}

        {/* Success State */}
        {!isReviewsLoading && !isReviewsError && reviews && reviews.length > 0 && (
          <div className="space-y-3">
            {reviews.map((review) => (
              <UserReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>

      {/* Log out CTA */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto h-12 w-full rounded-full border border-border-default bg-card text-sm font-medium text-primary hover:border-bad/40 hover:text-bad active:bg-elevated transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-warm"
      >
        <IconLogout size={18} className="text-secondary" />
        Log out
      </button>
    </div>
  )
}

export default ProfilePage

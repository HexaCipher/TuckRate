import { Navigate, useNavigate } from 'react-router-dom'
import {
  IconBed,
  IconHome,
  IconLogout,
  IconStarFilled,
  IconChevronRight,
  IconAlertTriangle,
  IconNotes,
  IconShield,
  IconRefresh,
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
      className="group w-full text-left p-4 sm:p-5 rounded-2xl bg-card border border-border-subtle shadow-warm hover:border-border-default hover:shadow-warm-md active:scale-[0.99] active:bg-elevated/40 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-secondary tracking-wider uppercase">
            {review.item?.category ?? 'Menu item'}
          </p>
          <h3 className="text-sm sm:text-base font-bold text-primary truncate group-hover:text-accent transition-colors">
            {review.item?.name ?? 'Unknown item'}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-secondary shrink-0 pt-0.5">
          <span className="text-sm font-bold tabular-nums text-primary">
            ₹{Number(review.item?.price ?? 0)}
          </span>
          <IconChevronRight size={16} className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2.5">
        <StarRating rating={review.stars} />
        <WorthItBadge worthItPct={review.worth_it ? 100 : 0} ratingCount={3} />
      </div>

      {review.review_text && (
        <p className="text-xs sm:text-[13px] text-primary/90 line-clamp-2 mb-2.5 leading-relaxed bg-app/60 p-3 rounded-xl border border-border-subtle/80 italic">
          &ldquo;{review.review_text}&rdquo;
        </p>
      )}

      {review.hygiene_flag && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-bad mb-2.5 bg-bad-bg/60 px-2.5 py-1 rounded-lg border border-bad/15 w-fit">
          <IconAlertTriangle size={13} className="shrink-0" />
          <span>Reported hygiene issue</span>
        </div>
      )}

      <p className="text-[11px] text-muted font-medium">
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
      console.warn('[WorthIt] Logout failed:', err)
    }
  }

  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto flex-1 flex flex-col px-4 sm:px-6 pt-5 pb-6 text-primary">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Profile</h1>
      </div>

      {/* User Info Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border-subtle shadow-warm mb-6 sm:mb-8 text-center flex flex-col items-center relative overflow-hidden">
        {/* Avatar initial */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-[#FDECE2] to-[#F8D2BD] border-2 border-white shadow-warm flex items-center justify-center mb-3.5 select-none transition-transform hover:scale-105">
          <span className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">
            {email.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* User Identity */}
        <h2 className="text-base sm:text-lg font-bold text-primary break-all max-w-full leading-snug tracking-tight px-2">
          {email}
        </h2>

        {/* Room number from public.users */}
        {profile.isLoading && (
          <div className="h-7 w-28 rounded-full bg-elevated/70 mt-3 animate-pulse" />
        )}

        {profile.isError && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-bad bg-bad-bg/50 px-3 py-1 rounded-full border border-bad/20">
            <IconAlertTriangle size={13} />
            <span>Couldn&apos;t load room</span>
            <button
              type="button"
              onClick={() => void profile.refetch()}
              className="text-accent underline font-semibold cursor-pointer ml-1"
            >
              Retry
            </button>
          </div>
        )}

        {profile.isSuccess && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {profile.data.room_number ? (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-elevated/80 border border-border-subtle text-xs font-medium text-secondary">
                <IconBed size={14} className="text-secondary/80" />
                <span>Room {profile.data.room_number}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-elevated/40 border border-border-subtle/60 text-xs font-normal text-muted">
                <IconHome size={13} className="text-muted/70" />
                <span>No room number set</span>
              </span>
            )}

            {/* Contribution Count Badge */}
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-mixed-bg/80 border border-mixed/20 text-mixed text-xs font-semibold">
              <IconStarFilled size={12} className="text-mixed" />
              <span>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
            </span>
          </div>
        )}

        {/* Admin Moderation Queue Button */}
        {profile.isSuccess && profile.data.is_admin && (
          <div className="mt-5 pt-4 border-t border-border-subtle/80 w-full flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="h-10 px-5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold shadow-warm hover:shadow-warm-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconShield size={16} />
              <span>Moderation Queue</span>
              <IconChevronRight size={15} className="opacity-80" />
            </button>
          </div>
        )}
      </div>

      {/* My Reviews Section */}
      <section className="flex-1 flex flex-col mb-8">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">My Reviews</h2>
          {reviews !== undefined && (
            <span className="text-xs font-medium text-secondary bg-card border border-border-subtle px-2.5 py-0.5 rounded-full shadow-xs tabular-nums">
              {reviewCount} {reviewCount === 1 ? 'review' : 'total'}
            </span>
          )}
        </div>

        {/* Loading State */}
        {isReviewsLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl bg-card border border-border-subtle shadow-warm animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded-md bg-elevated" />
                  <div className="h-4 w-12 rounded-md bg-elevated" />
                </div>
                <div className="h-4 w-24 rounded-md bg-elevated" />
                <div className="h-3 w-4/5 rounded-md bg-elevated" />
                <div className="h-3 w-20 rounded-md bg-elevated" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isReviewsError && !isReviewsLoading && (
          <div className="p-7 text-center rounded-3xl bg-card border border-border-subtle shadow-warm my-4">
            <div className="w-12 h-12 rounded-2xl bg-bad-bg/60 border border-bad/20 flex items-center justify-center mx-auto mb-3 text-bad">
              <IconAlertTriangle size={22} />
            </div>
            <p className="text-sm font-semibold text-primary mb-1">
              Couldn&apos;t load your reviews
            </p>
            <p className="text-xs text-secondary mb-4 max-w-xs mx-auto">
              Please check your connection and try refreshing your review history.
            </p>
            <button
              type="button"
              onClick={() => void refetchReviews()}
              className="h-10 px-5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-semibold cursor-pointer shadow-warm hover:shadow-warm-md active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <IconRefresh size={14} />
              <span>Try again</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isReviewsLoading && !isReviewsError && reviews && reviews.length === 0 && (
          <div className="p-7 sm:p-8 text-center rounded-3xl bg-card border border-border-subtle shadow-warm flex flex-col items-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-elevated/70 to-elevated border border-border-subtle flex items-center justify-center mb-4 text-secondary shadow-xs">
              <IconNotes size={26} stroke={1.75} />
            </div>
            <h3 className="text-base font-semibold text-primary mb-1.5 tracking-tight">
              You haven&apos;t rated anything yet.
            </h3>
            <p className="text-xs sm:text-sm text-secondary mb-5 max-w-xs leading-relaxed">
              Share your opinion on tuck shop items to help other students decide.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="h-11 px-6 rounded-full bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-warm hover:shadow-warm-md active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <span>Browse menu</span>
              <IconChevronRight size={16} stroke={2.2} />
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
        className="mt-auto h-12 w-full rounded-2xl sm:rounded-full border border-border-default bg-card/90 hover:bg-card hover:border-bad/40 text-secondary hover:text-bad active:bg-elevated transition-all flex items-center justify-center gap-2 text-sm font-medium cursor-pointer shadow-xs active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent"
      >
        <IconLogout size={18} />
        <span>Log out</span>
      </button>
    </div>
  )
}

export default ProfilePage


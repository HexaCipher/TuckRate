import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import {
  IconArrowLeft,
  IconStarFilled,
  IconStar,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'
import { useItemDetail } from '../hooks/useItemDetail'
import { useUserRating } from '../hooks/useUserRating'
import { useSubmitRating } from '../hooks/useSubmitRating'
import { useToast } from '../hooks/useToast'
import type { Item, Rating } from '../types/database'

const STAR_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Great!']

interface RateFormProps {
  itemId: string
  userId: string
  item: Item
  existingRating: Rating | null
  onSubmitSuccess: () => void
}

function RateForm({ itemId, userId, item, existingRating, onSubmitSuccess }: RateFormProps) {
  const submitRating = useSubmitRating(itemId)
  const isEditing = Boolean(existingRating)

  // Initialize form directly from existing rating without setState-in-effect
  const [stars, setStars] = useState<number>(existingRating?.stars ?? 0)
  const [worthIt, setWorthIt] = useState<boolean | null>(existingRating?.worth_it ?? null)
  const [reviewText, setReviewText] = useState<string>(existingRating?.review_text ?? '')
  const [hygieneFlag, setHygieneFlag] = useState<boolean>(existingRating?.hygiene_flag ?? false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const isFormValid = stars >= 1 && stars <= 5 && worthIt !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)

    if (!isFormValid) {
      setValidationError('Add a star rating and let us know if it is worth it.')
      return
    }

    try {
      await submitRating.mutateAsync({
        itemId,
        userId,
        stars,
        worthIt,
        reviewText: reviewText.trim() || null,
        hygieneFlag,
      })

      onSubmitSuccess()
    } catch (err) {
      console.error('[WorthIt] Failed to submit rating:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-4 space-y-6">
      {/* Item Context Card */}
      <div className="p-4 rounded-2xl bg-card border border-border-subtle shadow-warm flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs text-secondary font-medium uppercase tracking-wide">
            {item.category ?? 'Menu item'}
          </span>
          <h2 className="text-base font-semibold text-primary truncate">
            {item.name}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-base font-bold text-primary tabular-nums">
            ₹{Number(item.price)}
          </span>
        </div>
      </div>

      {/* Network submission error banner (preserves form values) */}
      {submitRating.isError && (
        <div className="p-3.5 rounded-2xl bg-bad-bg border border-bad/20 flex items-start gap-2.5 text-xs text-bad">
          <IconAlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Couldn&apos;t save your rating.</p>
            <p className="mt-0.5">Please check your connection and tap Submit again.</p>
          </div>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="p-3 rounded-2xl bg-bad-bg border border-bad/20 text-xs text-bad font-medium">
          {validationError}
        </div>
      )}

      {/* Step 1: Star Rating Selector (Required) */}
      <div className="p-4 rounded-2xl bg-card border border-border-subtle shadow-warm text-center">
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          Star Rating <span className="text-accent">*</span>
        </label>
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((starValue) => {
            const isSelected = starValue <= stars
            return (
              <button
                key={starValue}
                type="button"
                onClick={() => {
                  setStars(starValue)
                  setValidationError(null)
                }}
                aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                className="w-12 h-12 flex items-center justify-center rounded-xl text-star transition-transform active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
              >
                {isSelected ? (
                  <IconStarFilled size={34} className="text-star drop-shadow-xs" />
                ) : (
                  <IconStar size={34} stroke={1.5} className="text-border-strong hover:text-star/50" />
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs font-medium text-secondary h-4 mt-1">
          {stars > 0 ? STAR_LABELS[stars] : 'Tap a star to rate'}
        </p>
      </div>

      {/* Step 2: Worth the price? (Required toggle) */}
      <div className="p-4 rounded-2xl bg-card border border-border-subtle shadow-warm">
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-3 text-center">
          Worth the price? <span className="text-accent">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setWorthIt(true)
              setValidationError(null)
            }}
            className={`h-12 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all cursor-pointer border ${
              worthIt === true
                ? 'bg-good-bg text-good border-good/40 font-semibold shadow-warm scale-[1.02]'
                : 'bg-card text-secondary border-border-subtle hover:border-border-default active:bg-elevated'
            }`}
          >
            <IconCheck size={18} stroke={2.5} />
            <span>Yes, worth it</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWorthIt(false)
              setValidationError(null)
            }}
            className={`h-12 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all cursor-pointer border ${
              worthIt === false
                ? 'bg-bad-bg text-bad border-bad/40 font-semibold shadow-warm scale-[1.02]'
                : 'bg-card text-secondary border-border-subtle hover:border-border-default active:bg-elevated'
            }`}
          >
            <IconX size={18} stroke={2.5} />
            <span>Skip it</span>
          </button>
        </div>
      </div>

      {/* Step 3: Review Text (Optional, max 500 chars) */}
      <div className="p-4 rounded-2xl bg-card border border-border-subtle shadow-warm">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="review-text" className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Review (optional)
          </label>
          <span className="text-[11px] text-muted tabular-nums">
            {reviewText.length}/500
          </span>
        </div>
        <textarea
          id="review-text"
          rows={3}
          maxLength={500}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="What did you think? Taste, quantity, freshness..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-app/50 border border-border-subtle text-sm text-primary placeholder:text-muted focus:bg-card focus:border-accent focus:outline-none transition-all resize-none"
        />
      </div>

      {/* Step 4: Hygiene Issue Flag (Optional) */}
      <div className="p-4 rounded-2xl bg-card border border-border-subtle shadow-warm">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hygieneFlag}
            onChange={(e) => setHygieneFlag(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border-strong text-bad focus:ring-bad accent-[#B23B3B] cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <IconAlertTriangle size={15} className="text-bad" />
              <span>Report a hygiene issue</span>
            </div>
            <p className="text-[11px] text-secondary mt-0.5 leading-normal">
              Found something contaminated, stale, or unsafe? Check this to alert students.
            </p>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!isFormValid || submitRating.isPending}
          className={`w-full h-12 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-warm transition-all cursor-pointer ${
            isFormValid && !submitRating.isPending
              ? 'bg-accent text-card active:bg-accent-hover active:scale-[0.99]'
              : 'bg-border-default text-muted cursor-not-allowed opacity-60'
          }`}
        >
          {submitRating.isPending ? (
            <>
              <IconLoader2 size={18} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{isEditing ? 'Update rating' : 'Submit rating'}</span>
          )}
        </button>
      </div>
    </form>
  )
}

function RatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const { data: itemData, isLoading: isItemLoading, isError: isItemError, refetch: refetchItem } = useItemDetail(id)
  const { data: existingRating, isLoading: isRatingLoading } = useUserRating(user?.id, id)

  // Auth-gated: redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `/item/${id}/rate` }} />
  }

  const isLoading = isItemLoading || isRatingLoading
  const isEditing = Boolean(existingRating)

  function handleSubmitSuccess() {
    showToast(isEditing ? 'Rating updated' : 'Rating saved')
    navigate(`/item/${id}`, { replace: true })
  }

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-dvh flex flex-col bg-app text-primary pb-10">
      {/* Header: Back arrow + Title */}
      <header className="flex items-center gap-3 px-4 h-14 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full text-secondary active:text-primary active:bg-card transition-colors cursor-pointer"
        >
          <IconArrowLeft size={22} stroke={1.75} />
        </button>
        <h1 className="text-base font-medium text-primary truncate">
          {isEditing ? 'Edit your rating' : 'Rate & review'}
        </h1>
      </header>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="px-4 py-6 space-y-6 animate-pulse">
          <div className="h-16 rounded-2xl bg-card border border-border-subtle" />
          <div className="h-28 rounded-2xl bg-card border border-border-subtle" />
          <div className="h-24 rounded-2xl bg-card border border-border-subtle" />
          <div className="h-32 rounded-2xl bg-card border border-border-subtle" />
        </div>
      )}

      {/* Item Error State */}
      {isItemError && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-bad-bg border border-bad/20 text-bad flex items-center justify-center mb-4">
            <IconAlertCircle size={28} stroke={1.75} />
          </div>
          <p className="text-sm font-semibold text-primary mb-2">Couldn&apos;t load item details.</p>
          <button
            type="button"
            onClick={() => void refetchItem()}
            className="h-11 px-6 rounded-full bg-accent text-card text-sm font-medium active:bg-accent-hover shadow-warm cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success / Form State */}
      {!isLoading && !isItemError && itemData && id && (
        <RateForm
          itemId={id}
          userId={user.id}
          item={itemData.item}
          existingRating={existingRating ?? null}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  )
}

export default RatePage

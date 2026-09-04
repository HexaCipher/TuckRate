import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft,
  IconShield,
  IconTrash,
  IconUserX,
  IconCheck,
  IconAlertCircle,
  IconLoader2,
  IconCircleCheck,
} from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'
import { useProfile } from '../hooks/useProfile'
import {
  useReports,
  useDismissReport,
  useRemoveReview,
  useBanUser,
} from '../hooks/useReports'
import { useToast } from '../hooks/useToast'
import StarRating from '../components/StarRating'
import WorthItBadge from '../components/WorthItBadge'
import { REPORT_REASONS, type ReportWithDetails } from '../types/database'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ModerationCardProps {
  report: ReportWithDetails
  onDismiss: (reportId: string) => Promise<void>
  onRemove: (reportId: string, ratingId: string) => Promise<void>
  onBan: (reportId: string, userId: string) => Promise<void>
  isProcessing: boolean
}

function ModerationCard({
  report,
  onDismiss,
  onRemove,
  onBan,
  isProcessing,
}: ModerationCardProps) {
  const [confirmAction, setConfirmAction] = useState<'remove' | 'ban' | null>(null)

  const reasonLabel = REPORT_REASONS[report.reason] ?? report.reason
  const rating = report.rating
  const authorId = rating?.user_id
  const authorRoom = rating?.author?.room_number
  const reporterRoom = report.reporter?.room_number

  return (
    <div className="p-4 rounded-2xl bg-card border border-border-subtle shadow-warm space-y-3.5 text-primary">
      {/* Top row: Reason badge + date */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-bad-bg text-bad">
          {reasonLabel}
        </span>
        <span className="text-[11px] text-muted">{formatDate(report.created_at)}</span>
      </div>

      {/* Item Context */}
      {rating?.item && (
        <div className="text-xs text-secondary font-medium">
          Target Item:{' '}
          <span className="font-semibold text-primary">{rating.item.name}</span>
          <span className="ml-1 text-muted tabular-nums">
            (₹{Number(rating.item.price)})
          </span>
        </div>
      )}

      {/* Flagged Review Details */}
      {rating ? (
        <div className="p-3 rounded-xl bg-app/60 border border-border-subtle space-y-2">
          <div className="flex items-center gap-2">
            <StarRating rating={rating.stars} />
            <WorthItBadge worthItPct={rating.worth_it ? 100 : 0} ratingCount={1} />
            {rating.hygiene_flag && (
              <span className="text-[10px] font-bold text-bad uppercase tracking-wider bg-bad-bg px-2 py-0.5 rounded">
                Hygiene Flagged
              </span>
            )}
          </div>

          {rating.review_text ? (
            <p className="text-xs text-primary leading-relaxed italic">
              &ldquo;{rating.review_text}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-muted italic">(No text comment)</p>
          )}

          <div className="text-[11px] text-muted pt-1 flex items-center justify-between border-t border-border-subtle/60">
            <span>Author: {authorRoom ? `Room ${authorRoom}` : 'Anonymous'}</span>
            <span className="font-mono text-[10px] text-muted truncate max-w-[120px]">
              {authorId?.slice(0, 8)}...
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-elevated/40 text-xs text-muted italic">
          (Review was already removed or deleted)
        </div>
      )}

      {/* Reporter details and notes */}
      <div className="text-xs text-secondary space-y-1">
        <p>
          Reported by:{' '}
          <span className="font-medium text-primary">
            {reporterRoom ? `Room ${reporterRoom}` : 'Student'}
          </span>
        </p>
        {report.comment && (
          <p className="text-[11px] bg-card p-2 rounded-lg border border-border-subtle text-primary/80">
            <strong className="text-secondary">Reporter note:</strong> {report.comment}
          </p>
        )}
      </div>

      {/* Confirm prompts for destructive actions */}
      {confirmAction === 'remove' && (
        <div className="p-3 rounded-xl bg-bad-bg border border-bad/30 text-xs space-y-2">
          <p className="font-semibold text-bad">Remove this review permanently?</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                if (rating) {
                  void onRemove(report.id, rating.id)
                }
              }}
              className="h-8 px-3 rounded-full bg-bad text-card font-semibold text-[11px] cursor-pointer shadow-warm"
            >
              Yes, delete review
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setConfirmAction(null)}
              className="h-8 px-3 rounded-full border border-border-default text-secondary text-[11px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmAction === 'ban' && (
        <div className="p-3 rounded-xl bg-bad-bg border border-bad/30 text-xs space-y-2">
          <p className="font-semibold text-bad">
            Ban this user account from submitting future ratings?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                if (authorId) {
                  void onBan(report.id, authorId)
                }
              }}
              className="h-8 px-3 rounded-full bg-bad text-card font-semibold text-[11px] cursor-pointer shadow-warm"
            >
              Yes, ban user
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setConfirmAction(null)}
              className="h-8 px-3 rounded-full border border-border-default text-secondary text-[11px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!confirmAction && (
        <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
          {/* Dismiss button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => void onDismiss(report.id)}
            className="flex-1 h-9 rounded-full border border-border-default bg-card hover:bg-elevated text-xs font-semibold text-secondary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {isProcessing ? (
              <IconLoader2 size={14} className="animate-spin" />
            ) : (
              <IconCheck size={14} />
            )}
            <span>Dismiss</span>
          </button>

          {/* Remove review button */}
          {rating && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setConfirmAction('remove')}
              className="flex-1 h-9 rounded-full border border-bad/30 bg-card hover:bg-bad-bg text-xs font-semibold text-bad flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <IconTrash size={14} />
              <span>Remove</span>
            </button>
          )}

          {/* Ban user button */}
          {authorId && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setConfirmAction('ban')}
              className="flex-1 h-9 rounded-full bg-bad text-card text-xs font-semibold flex items-center justify-center gap-1.5 shadow-warm hover:opacity-90 active:scale-95 cursor-pointer transition-all"
            >
              <IconUserX size={14} />
              <span>Ban</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Admin Moderation screen (docs/3-App-Flow.md §9).
 * Access gated by is_admin check.
 * Lists pending flagged reviews with Dismiss, Remove review, and Ban user actions.
 */
function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const profile = useProfile()
  const { showToast } = useToast()

  const isAdmin = Boolean(profile.data?.is_admin)

  const {
    data: reports,
    isLoading: isReportsLoading,
    isError: isReportsError,
    refetch: refetchReports,
  } = useReports(isAdmin)

  const dismissReport = useDismissReport()
  const removeReview = useRemoveReview()
  const banUser = useBanUser()

  const isActionPending =
    dismissReport.isPending || removeReview.isPending || banUser.isPending

  // Access control: If user is logged out or profile is loaded and is NOT admin, redirect Home
  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />
  }

  if (!profile.isLoading && !isAdmin) {
    return <Navigate to="/" replace />
  }

  async function handleDismiss(reportId: string) {
    try {
      await dismissReport.mutateAsync(reportId)
      showToast('Report dismissed')
    } catch {
      showToast({ message: 'Failed to dismiss report. Retry.', type: 'error' })
    }
  }

  async function handleRemoveReview(reportId: string, ratingId: string) {
    try {
      await removeReview.mutateAsync({ reportId, ratingId })
      showToast('Review removed')
    } catch {
      showToast({ message: 'Failed to remove review. Retry.', type: 'error' })
    }
  }

  async function handleBanUser(reportId: string, targetUserId: string) {
    try {
      await banUser.mutateAsync({ reportId, userId: targetUserId })
      showToast('User has been banned')
    } catch {
      showToast({ message: 'Failed to ban user. Retry.', type: 'error' })
    }
  }

  const pendingCount = reports?.length ?? 0

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-dvh flex flex-col bg-app text-primary pb-10">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border-subtle bg-card/60">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Go to profile"
            className="w-10 h-10 flex items-center justify-center rounded-full text-secondary active:text-primary active:bg-elevated transition-colors cursor-pointer"
          >
            <IconArrowLeft size={22} stroke={1.75} />
          </button>
          <div className="flex items-center gap-1.5">
            <IconShield size={18} className="text-accent" />
            <h1 className="text-base font-semibold text-primary">Moderation</h1>
          </div>
        </div>

        {reports && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-light text-accent-dark">
            {pendingCount} pending
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Loading State */}
        {(profile.isLoading || isReportsLoading) && (
          <div className="space-y-3.5 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-card border border-border-subtle animate-pulse space-y-3"
              >
                <div className="h-4 w-28 rounded bg-elevated" />
                <div className="h-16 rounded-xl bg-elevated" />
                <div className="h-8 rounded-full bg-elevated" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isReportsError && !isReportsLoading && (
          <div className="py-16 text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-bad-bg border border-bad/20 text-bad flex items-center justify-center mx-auto">
              <IconAlertCircle size={24} />
            </div>
            <p className="text-sm font-semibold text-primary">
              Couldn&apos;t load moderation reports.
            </p>
            <button
              type="button"
              onClick={() => void refetchReports()}
              className="h-10 px-5 rounded-full bg-accent text-card text-xs font-semibold shadow-warm cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isReportsLoading && !isReportsError && reports && reports.length === 0 && (
          <div className="py-20 text-center px-6 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-good-bg text-good flex items-center justify-center mx-auto border border-good/20 shadow-warm">
              <IconCircleCheck size={30} stroke={2} />
            </div>
            <h2 className="text-base font-semibold text-primary">No pending reports</h2>
            <p className="text-xs text-secondary max-w-xs mx-auto">
              All community reports have been reviewed. The review queue is clear!
            </p>
            <button
              type="button"
              onClick={() => void refetchReports()}
              className="text-xs text-accent font-semibold hover:underline cursor-pointer pt-2 inline-block"
            >
              Refresh queue
            </button>
          </div>
        )}

        {/* Success List */}
        {!isReportsLoading && !isReportsError && reports && reports.length > 0 && (
          <div className="space-y-3.5">
            {reports.map((report) => (
              <ModerationCard
                key={report.id}
                report={report}
                onDismiss={handleDismiss}
                onRemove={handleRemoveReview}
                onBan={handleBanUser}
                isProcessing={isActionPending}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminPage

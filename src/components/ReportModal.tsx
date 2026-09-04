import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconX,
  IconAlertTriangle,
  IconLoader2,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'
import { useSubmitReport } from '../hooks/useSubmitReport'
import { useToast } from '../hooks/useToast'
import type { Report } from '../types/database'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  ratingId: string
  ratingAuthorId: string
  reviewSnippet?: string | null
  returnPath?: string
}

const REASON_OPTIONS: { id: Report['reason']; label: string; description: string }[] = [
  {
    id: 'fake_spam',
    label: 'Fake / Spam',
    description: 'Promotional, duplicate, or clearly automated review.',
  },
  {
    id: 'offensive',
    label: 'Offensive',
    description: 'Abusive language, harassment, or hate speech.',
  },
  {
    id: 'unrelated',
    label: 'Unrelated to food',
    description: 'Nothing to do with this tuck shop item or taste.',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other violations or quality concerns.',
  },
]

function ReportModal({
  isOpen,
  onClose,
  ratingId,
  ratingAuthorId,
  reviewSnippet,
  returnPath = '/',
}: ReportModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const submitReport = useSubmitReport()

  const [selectedReason, setSelectedReason] = useState<Report['reason'] | null>(null)
  const [comment, setComment] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const isOwnReview = user?.id === ratingAuthorId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!user) {
      navigate('/login', { state: { from: returnPath } })
      return
    }

    if (!selectedReason) {
      setErrorMessage('Please choose a reason for your report.')
      return
    }

    try {
      await submitReport.mutateAsync({
        ratingId,
        reportedBy: user.id,
        reason: selectedReason,
        comment,
      })

      showToast('Report submitted — thanks for flagging this')
      onClose()
      // Reset state
      setSelectedReason(null)
      setComment('')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage("Couldn't submit report. Retry.")
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-primary/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Clickable backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-card border border-border-default shadow-warm-lg p-5 text-primary max-h-[90dvh] flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-bad-bg text-bad flex items-center justify-center shrink-0">
              <IconAlertTriangle size={17} stroke={2} />
            </div>
            <h2 id="report-modal-title" className="text-base font-semibold text-primary">
              Report Review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <IconX size={18} stroke={2} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-3 space-y-4 flex-1">
          {/* Review snippet preview if available */}
          {reviewSnippet && (
            <div className="p-3 rounded-xl bg-app/60 border border-border-subtle text-xs text-secondary italic line-clamp-2">
              &ldquo;{reviewSnippet}&rdquo;
            </div>
          )}

          {/* Not logged in guard */}
          {!user ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-secondary">
                You need to be signed in to flag inappropriate reviews.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { state: { from: returnPath } })}
                className="h-10 px-6 rounded-full bg-accent text-card text-xs font-semibold shadow-warm cursor-pointer"
              >
                Sign in to continue
              </button>
            </div>
          ) : isOwnReview ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm font-medium text-secondary">
                You cannot report your own review.
              </p>
              <p className="text-xs text-muted">
                You can edit your rating from the item page if you wish to change it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-bad-bg border border-bad/20 flex items-center gap-2 text-xs text-bad font-medium">
                  <IconAlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Select a reason <span className="text-accent">*</span>
                </label>
                <div className="space-y-2">
                  {REASON_OPTIONS.map((opt) => {
                    const isSelected = selectedReason === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedReason(opt.id)
                          setErrorMessage(null)
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-accent-light/30 border-accent text-primary'
                            : 'bg-card border-border-subtle hover:border-border-default text-secondary'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-primary">{opt.label}</p>
                          <p className="text-[11px] text-muted mt-0.5">{opt.description}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-accent border-accent text-card'
                              : 'border-border-strong'
                          }`}
                        >
                          {isSelected && <IconCheck size={11} stroke={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Optional Comment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="report-comment" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    Additional notes (optional)
                  </label>
                  <span className="text-[11px] text-muted tabular-nums">
                    {comment.length}/200
                  </span>
                </div>
                <textarea
                  id="report-comment"
                  rows={2}
                  maxLength={200}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Provide context for moderators..."
                  className="w-full px-3 py-2 rounded-xl bg-app/50 border border-border-subtle text-xs text-primary placeholder:text-muted focus:bg-card focus:border-accent focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedReason || submitReport.isPending}
                  className={`w-full h-11 rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-warm transition-all cursor-pointer ${
                    selectedReason && !submitReport.isPending
                      ? 'bg-accent text-card active:bg-accent-hover'
                      : 'bg-border-default text-muted cursor-not-allowed opacity-60'
                  }`}
                >
                  {submitReport.isPending ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>Submitting report...</span>
                    </>
                  ) : (
                    <span>Submit report</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportModal

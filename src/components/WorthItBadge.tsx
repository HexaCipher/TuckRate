import type { WorthItStatus } from '../types/database'
import { getWorthItStatus } from '../types/database'

const BADGE_CONFIG: Record<Exclude<WorthItStatus, 'not_enough'>, { label: string; className: string }> = {
  worth_it: { label: 'Worth it', className: 'bg-good-bg text-good' },
  skip_it:  { label: 'Skip it', className: 'bg-bad-bg text-bad' },
  mixed:    { label: 'Mixed',   className: 'bg-mixed-bg text-mixed' },
}

interface WorthItBadgeProps {
  worthItPct: number
  ratingCount: number
  size?: 'sm' | 'md'
}

/**
 * Small color-coded pill badge per .agents/rules/design-system.md §Components:
 * "Rating badges: rounded-rect pills using the exact tint/text pairs above —
 * this is the primary at-a-glance scan element on every item row, keep it visually dominant"
 */
function WorthItBadge({ worthItPct, ratingCount, size = 'sm' }: WorthItBadgeProps) {
  const status = getWorthItStatus(worthItPct, ratingCount)
  if (status === 'not_enough') return null

  const config = BADGE_CONFIG[status]
  const sizeClasses = size === 'md' ? 'h-7 px-3 text-xs' : 'h-6 px-2.5 text-[11px]'

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none ${sizeClasses} ${config.className}`}>
      {config.label}
    </span>
  )
}

export default WorthItBadge

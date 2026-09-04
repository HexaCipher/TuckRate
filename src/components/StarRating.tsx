import { IconStarFilled } from '@tabler/icons-react'

interface StarRatingProps {
  rating: number
  count?: number
  /** Compact vs medium vs large variants */
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

/**
 * Display-only star rating — single filled star icon + numeric rating (e.g. "★ 4.3")
 * per .agents/rules/design-system.md §Components:
 * "Star icon: amber fill, shown as compact '★ 4.3' style, not five separate star icons on list rows"
 */
function StarRating({ rating, count, size = 'sm', showCount = true }: StarRatingProps) {
  const isLarge = size === 'lg'
  const isMedium = size === 'md'

  return (
    <span className="inline-flex items-center gap-1 select-none">
      <IconStarFilled
        size={isLarge ? 20 : isMedium ? 15 : 13}
        className="text-star shrink-0"
      />
      <span
        className={`tabular-nums ${
          isLarge
            ? 'text-2xl font-semibold text-primary'
            : isMedium
            ? 'text-sm font-semibold text-primary'
            : 'text-xs font-semibold text-primary'
        }`}
      >
        {rating > 0 ? rating.toFixed(1) : '—'}
      </span>
      {showCount && count !== undefined && (
        <span className={`tabular-nums ${isLarge ? 'text-sm' : 'text-[11px]'} text-secondary`}>
          ({count})
        </span>
      )}
    </span>
  )
}

export default StarRating

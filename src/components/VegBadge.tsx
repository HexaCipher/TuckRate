interface VegBadgeProps {
  isVeg: boolean
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Standard Indian FSSAI-style Veg / Non-Veg symbol.
 * Green square with green circle for vegetarian,
 * Brown/maroon square with triangle/circle for non-vegetarian.
 */
export function VegBadge({ isVeg, className = '', size = 'sm' }: VegBadgeProps) {
  const boxSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  const dotSize = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'

  if (isVeg) {
    return (
      <span
        className={`inline-flex items-center justify-center border border-emerald-600 rounded-[3px] bg-white/90 p-[1.5px] shrink-0 ${boxSize} ${className}`}
        title="Vegetarian"
        aria-label="Vegetarian"
      >
        <span className={`rounded-full bg-emerald-600 ${dotSize}`} />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center border border-amber-900 rounded-[3px] bg-white/90 p-[1.5px] shrink-0 ${boxSize} ${className}`}
      title="Non-vegetarian"
      aria-label="Non-vegetarian"
    >
      <span
        className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-amber-900"
      />
    </span>
  )
}

export default VegBadge

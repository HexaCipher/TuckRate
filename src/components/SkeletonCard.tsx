/**
 * Animated placeholder card for loading states in the warm theme.
 * Matches the shape/dimensions of ItemCard.
 */
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border-subtle shadow-warm animate-pulse min-h-[60px]">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/5 rounded bg-elevated" />
        <div className="h-3 w-1/4 rounded bg-elevated" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-10 rounded bg-elevated" />
        <div className="h-6 w-14 rounded-full bg-elevated" />
      </div>
    </div>
  )
}

export function SkeletonSpotlight() {
  return (
    <div className="w-full rounded-2xl bg-card border border-border-subtle shadow-warm overflow-hidden animate-pulse">
      <div className="w-full h-36 bg-elevated" />
      <div className="flex justify-between items-center p-4">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-2/5 rounded bg-elevated" />
          <div className="h-3 w-1/5 rounded bg-elevated" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-elevated" />
          <div className="h-6 w-16 rounded-full bg-elevated" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTopRatedCard() {
  return (
    <div className="w-[140px] shrink-0 rounded-2xl bg-card border border-border-subtle shadow-warm overflow-hidden animate-pulse">
      <div className="w-full h-22 bg-elevated" />
      <div className="p-3 space-y-1.5">
        <div className="h-3.5 w-3/4 rounded bg-elevated" />
        <div className="flex justify-between items-center">
          <div className="h-3 w-8 rounded bg-elevated" />
          <div className="h-3.5 w-10 rounded bg-elevated" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonCard

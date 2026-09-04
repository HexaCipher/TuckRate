/**
 * Animated placeholder card for loading states in the warm theme.
 * Matches the shape/dimensions of ItemCard to prevent layout shift.
 */
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-card border border-border-subtle shadow-warm animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-elevated shrink-0" />

      {/* Middle lines */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 w-3/5 rounded-md bg-elevated" />
        <div className="h-3 w-1/3 rounded-md bg-elevated" />
      </div>

      {/* Right pill */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="h-3.5 w-12 rounded-md bg-elevated" />
        <div className="h-5 w-14 rounded-full bg-elevated" />
      </div>
    </div>
  )
}

export function SkeletonSpotlight() {
  return (
    <div className="w-full rounded-3xl bg-card border border-border-subtle shadow-warm overflow-hidden animate-pulse p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="h-5 w-32 rounded-full bg-elevated" />
        <div className="h-5 w-3/5 rounded-md bg-elevated" />
        <div className="h-4 w-1/4 rounded-md bg-elevated" />
        <div className="h-6 w-40 rounded-full bg-elevated" />
      </div>
      <div className="w-full sm:w-36 sm:h-36 h-28 rounded-2xl bg-elevated shrink-0" />
    </div>
  )
}

export function SkeletonTopRatedCard() {
  return (
    <div className="w-[150px] sm:w-[165px] shrink-0 rounded-2xl bg-card border border-border-subtle shadow-warm overflow-hidden animate-pulse">
      <div className="w-full h-26 bg-elevated" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 w-3/4 rounded-md bg-elevated" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-3.5 w-8 rounded-md bg-elevated" />
          <div className="h-4 w-10 rounded-md bg-elevated" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonCard

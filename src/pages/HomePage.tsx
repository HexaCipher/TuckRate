import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconRefresh, IconAlertCircle } from '@tabler/icons-react'
import Header from '../components/Header'
import SpotlightCard from '../components/SpotlightCard'
import TopRatedCard from '../components/TopRatedCard'
import ItemCard from '../components/ItemCard'
import SkeletonCard, { SkeletonSpotlight, SkeletonTopRatedCard } from '../components/SkeletonCard'
import { useItems } from '../hooks/useItems'

/**
 * Capitalize first letter helper for category labels (Sentence case per design-system.md)
 */
function formatCategory(category: string): string {
  if (!category) return ''
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
}

type FilterType = 'top_rated' | 'under_50' | 'worth_it'

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'top_rated', label: 'Top rated' },
  { id: 'under_50', label: 'Under ₹50' },
  { id: 'worth_it', label: 'Worth it' },
]

/**
 * Home screen component per .agents/rules/design-system.md and docs/3-App-Flow.md §2.
 * Layout top to bottom:
 * 1. Header: "TuckRate" wordmark, item/rating count summary below it
 * 2. Search bar (rounded pill input, navigates to Search screen on tap)
 * 3. Filter chips: "Top rated", "Under ₹50", "Worth it" + category chips row
 * 4. Spotlight card: this week's top-rated item (no CTA button, no "Order Now")
 * 5. "Top Rated" horizontally scrollable card row (no add/plus button)
 * 6. Full menu list below (vertical rows: name + price left, star rating + badge right)
 * 7. Bottom nav (rendered via App layout)
 *
 * All 4 states: success, loading, empty, error (keeps cached data visible if available).
 */
function HomePage() {
  const navigate = useNavigate()
  const { data: items, isLoading, isError, refetch, isFetching } = useItems()
  const [activeFilter, setActiveFilter] = useState<FilterType>('top_rated')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Derive unique categories dynamically from fetched item data
  const categories = useMemo(() => {
    if (!items || items.length === 0) return ['all']
    const unique = Array.from(
      new Set(items.map(i => i.category?.toLowerCase().trim()).filter(Boolean) as string[])
    )
    return ['all', ...unique]
  }, [items])

  // Sort items by rating for spotlight and top-rated sections
  const sortedByRating = useMemo(() => {
    if (!items) return []
    return [...items].sort((a, b) => {
      // Primary sort: average stars descending
      const starDiff = Number(b.avg_stars) - Number(a.avg_stars)
      if (starDiff !== 0) return starDiff
      // Secondary sort: rating count descending
      return b.rating_count - a.rating_count
    })
  }, [items])

  // Spotlight item: highest rated item overall (or first item if unrated)
  const spotlightItem = sortedByRating.length > 0 ? sortedByRating[0] : null

  // Top rated items for horizontal carousel (up to 6 items)
  const topRatedItems = useMemo(() => {
    return sortedByRating.slice(0, 6)
  }, [sortedByRating])

  // Filtered menu list for the vertical section below
  const filteredList = useMemo(() => {
    if (!items) return []
    let list = [...items]

    // 1. Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(i => i.category?.toLowerCase().trim() === selectedCategory)
    }

    // 2. Sort / Quick filter
    if (activeFilter === 'under_50') {
      list = list.filter(i => Number(i.price) <= 50)
      list.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (activeFilter === 'worth_it') {
      list = list.filter(i => i.rating_count > 0 && i.worth_it_pct >= 70)
      list.sort((a, b) => b.worth_it_pct - a.worth_it_pct || Number(b.avg_stars) - Number(a.avg_stars))
    } else {
      // 'top_rated'
      list.sort((a, b) => {
        const starDiff = Number(b.avg_stars) - Number(a.avg_stars)
        if (starDiff !== 0) return starDiff
        return b.rating_count - a.rating_count
      })
    }

    return list
  }, [items, selectedCategory, activeFilter])

  // Summary counts for header
  const totalItems = items?.length ?? 0
  const totalRatings = useMemo(() => {
    return items?.reduce((sum, i) => sum + i.rating_count, 0) ?? 0
  }, [items])

  const summaryText =
    totalItems > 0
      ? `${totalItems} items rated by ${totalRatings} students`
      : 'Browse the tuck shop menu'

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-dvh flex flex-col bg-app text-primary pb-6">
      {/* 1. Header: TuckRate wordmark + summary below */}
      <Header summary={summaryText} />

      {/* 2. Search bar: rounded pill input, navigates to /search on tap */}
      <div className="px-4 pb-3.5">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="w-full h-11 flex items-center gap-3 px-4 rounded-full bg-card border border-border-subtle shadow-warm text-sm text-muted cursor-pointer active:scale-[0.99] transition-all"
        >
          <IconSearch size={18} stroke={1.75} className="text-secondary shrink-0" />
          <span className="truncate">Search items or drinks…</span>
        </button>
      </div>

      {/* Offline/Error banner with cached data */}
      {isError && items && items.length > 0 && (
        <div className="mx-4 mb-3 p-3 rounded-2xl bg-bad-bg border border-bad/20 flex items-center justify-between gap-2 text-xs text-bad">
          <div className="flex items-center gap-2 min-w-0 font-medium">
            <IconAlertCircle size={16} stroke={2} className="shrink-0" />
            <span className="truncate">Offline mode — showing cached menu.</span>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="font-semibold underline shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Refreshing indicator */}
      {isFetching && !isLoading && (
        <div className="flex justify-center items-center gap-1.5 py-1 text-xs text-secondary">
          <IconRefresh size={13} className="animate-spin text-accent" />
          <span>Refreshing menu…</span>
        </div>
      )}

      {/* ─── State 1: Loading State ─── */}
      {isLoading && (
        <div className="space-y-5">
          {/* Skeleton filter chips */}
          <div className="flex items-center gap-2 overflow-hidden px-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 rounded-full bg-card border border-border-subtle animate-pulse shrink-0"
              />
            ))}
          </div>

          {/* Skeleton category chips */}
          <div className="flex items-center gap-2.5 overflow-hidden px-4 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-20 rounded-full bg-card border border-border-subtle animate-pulse shrink-0"
              />
            ))}
          </div>

          {/* Skeleton spotlight card */}
          <div className="px-4">
            <SkeletonSpotlight />
          </div>

          {/* Skeleton Top Rated section */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-card animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              <SkeletonTopRatedCard />
              <SkeletonTopRatedCard />
              <SkeletonTopRatedCard />
            </div>
          </div>

          {/* Skeleton full menu rows */}
          <div className="space-y-3 pt-1">
            <div className="h-4 w-28 rounded bg-card animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ─── State 2: Full Error State (No cached data) ─── */}
      {isError && (!items || items.length === 0) && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bad-bg border border-bad/20 text-bad flex items-center justify-center mb-4">
            <IconAlertCircle size={28} stroke={1.75} />
          </div>
          <h3 className="text-base font-semibold text-primary mb-1">
            Couldn&apos;t load the menu
          </h3>
          <p className="text-xs text-secondary max-w-xs mb-5">
            Please check your internet connection and try again.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="h-11 px-6 rounded-full bg-accent text-card text-sm font-semibold active:bg-accent-hover shadow-warm cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── State 3: Empty State (Zero items returned) ─── */}
      {!isLoading && !isError && items && items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-card border border-border-subtle shadow-warm flex items-center justify-center mb-4 text-secondary">
            <IconSearch size={28} stroke={1.5} />
          </div>
          <p className="text-sm font-semibold text-primary mb-1">
            No items rated yet — be the first.
          </p>
          <p className="text-xs text-secondary max-w-xs mb-4">
            Items added to the tuck shop menu will appear here for student ratings.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline cursor-pointer"
          >
            <IconRefresh size={14} />
            <span>Check again</span>
          </button>
        </div>
      )}

      {/* ─── State 4: Success State (Full Layout) ─── */}
      {!isLoading && items && items.length > 0 && (
        <div className="space-y-6">
          {/* 3. Filter chips: "Top rated", "Under ₹50", "Worth it" + Category chips */}
          <div className="space-y-2.5 pb-1">
            {/* Quick Sort / Filter row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4">
              {FILTER_OPTIONS.map((filter) => {
                const isSelected = activeFilter === filter.id
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`shrink-0 inline-flex items-center justify-center h-8 px-4 rounded-full text-xs transition-all select-none cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-card font-semibold shadow-warm active:scale-95'
                        : 'bg-card text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:scale-95 font-medium'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>

            {/* Category chips row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-0.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat
                const label = cat === 'all' ? 'All' : formatCategory(cat)

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 inline-flex items-center justify-center h-8 px-4 rounded-full text-xs transition-all select-none cursor-pointer ${
                      isSelected
                        ? 'bg-accent-light text-accent-dark font-semibold shadow-warm active:scale-95'
                        : 'bg-card/80 text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:bg-elevated active:scale-95 font-medium'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Spotlight card: this week's top-rated item */}
          {spotlightItem && (
            <section className="px-4" aria-label="Spotlight item">
              <SpotlightCard item={spotlightItem} />
            </section>
          )}

          {/* 5. "Top Rated" horizontally scrollable card row */}
          {topRatedItems.length > 0 && (
            <section className="space-y-3" aria-label="Top rated items">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-[15px] font-semibold text-primary tracking-tight">
                  Top Rated
                </h2>
                <span className="text-xs text-secondary font-normal">
                  Community favorites
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
                {topRatedItems.map(item => (
                  <TopRatedCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* 6. Full menu list below — vertical rows: name + price left, star rating + badge right */}
          <section className="px-4 space-y-3 pb-8" aria-label="Menu list">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-primary tracking-tight">
                {selectedCategory === 'all'
                  ? activeFilter === 'top_rated'
                    ? 'All Menu Items'
                    : activeFilter === 'under_50'
                    ? `Under ₹50 (${filteredList.length})`
                    : `Worth It (${filteredList.length})`
                  : `${formatCategory(selectedCategory)} (${filteredList.length})`}
              </h2>
              {(selectedCategory !== 'all' || activeFilter !== 'top_rated') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all')
                    setActiveFilter('top_rated')
                  }}
                  className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>

            {filteredList.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-card border border-border-subtle p-4">
                <p className="text-xs text-secondary">
                  No items match the selected filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all')
                    setActiveFilter('top_rated')
                  }}
                  className="text-xs text-accent font-medium hover:underline mt-2 inline-block cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredList.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default HomePage

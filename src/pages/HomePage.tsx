import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconRefresh,
  IconAlertCircle,
  IconAdjustmentsHorizontal,
  IconStar,
  IconLeaf,
  IconFlame,
  IconToolsKitchen2,
  IconChevronDown,
} from '@tabler/icons-react'
import Header from '../components/Header'
import SpotlightCard from '../components/SpotlightCard'
import TopRatedCard from '../components/TopRatedCard'
import ItemCard from '../components/ItemCard'
import SkeletonCard, {
  SkeletonSpotlight,
  SkeletonTopRatedCard,
} from '../components/SkeletonCard'
import FilterModal, {
  type FilterState,
  type PriceFilter,
} from '../components/FilterModal'
import { getCategoryVisual } from '../lib/categories'
import { useItems } from '../hooks/useItems'

/**
 * Capitalize first letter helper for category labels (Sentence case per design-system.md)
 */
function formatCategory(category: string): string {
  if (!category) return ''
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
}

const DEFAULT_FILTERS: FilterState = {
  price: 'any',
  sort: 'top_rated',
  dietary: 'all',
}

/**
 * WorthIt Home Experience per design-system.md, docs/3-App-Flow.md §2,
 * and Prompt Refinement Specifications.
 *
 * Designed for hostel students standing at the tuck shop counter
 * making 5–15 second purchasing decisions.
 */
function HomePage() {
  const navigate = useNavigate()
  const { data: items, isLoading, isError, refetch, isFetching } = useItems()

  // State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [worthItOnly, setWorthItOnly] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Derive unique categories dynamically from fetched item data
  const categories = useMemo(() => {
    if (!items || items.length === 0) return ['all']
    const unique = Array.from(
      new Set(
        items
          .map((i) => i.category?.toLowerCase().trim())
          .filter(Boolean) as string[]
      )
    )
    return ['all', ...unique]
  }, [items])

  // Sort items for hero and top-rated carousel
  const sortedByRating = useMemo(() => {
    if (!items) return []
    return [...items].sort((a, b) => {
      const starDiff = Number(b.avg_stars) - Number(a.avg_stars)
      if (starDiff !== 0) return starDiff
      return b.rating_count - a.rating_count
    })
  }, [items])

  // Featured / Spotlight hero item
  const spotlightItem = sortedByRating.length > 0 ? sortedByRating[0] : null

  // Top Rated carousel items (up to 6 items)
  const topRatedItems = useMemo(() => {
    return sortedByRating.slice(0, 6)
  }, [sortedByRating])

  // Filtered menu list for the main catalog
  const filteredList = useMemo(() => {
    if (!items) return []
    let list = [...items]

    // 1. Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(
        (i) => i.category?.toLowerCase().trim() === selectedCategory
      )
    }

    // 2. Dietary filter
    if (filters.dietary === 'veg_only') {
      list = list.filter((i) => i.is_veg)
    }

    // 3. Price filter
    if (filters.price === 'under_30') {
      list = list.filter((i) => Number(i.price) <= 30)
    } else if (filters.price === 'under_50') {
      list = list.filter((i) => Number(i.price) <= 50)
    } else if (filters.price === 'under_100') {
      list = list.filter((i) => Number(i.price) <= 100)
    }

    // 4. Quick "Worth it" toggle
    if (worthItOnly) {
      list = list.filter((i) => i.rating_count > 0 && i.worth_it_pct >= 70)
    }

    // 5. Sorting
    if (filters.sort === 'most_reviewed') {
      list.sort((a, b) => {
        const countDiff = b.rating_count - a.rating_count
        if (countDiff !== 0) return countDiff
        return Number(b.avg_stars) - Number(a.avg_stars)
      })
    } else if (filters.sort === 'price_asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (filters.sort === 'price_desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price))
    } else {
      // 'top_rated'
      list.sort((a, b) => {
        const starDiff = Number(b.avg_stars) - Number(a.avg_stars)
        if (starDiff !== 0) return starDiff
        return b.rating_count - a.rating_count
      })
    }

    return list
  }, [items, selectedCategory, filters, worthItOnly])

  // Summary counts for header
  const totalItems = items?.length ?? 0
  const totalRatings = useMemo(() => {
    return items?.reduce((sum, i) => sum + i.rating_count, 0) ?? 0
  }, [items])

  const summaryText =
    totalItems > 0
      ? `${totalItems} tuck shop items rated by ${totalRatings} students`
      : 'Browse the tuck shop menu'

  // Helper to toggle quick price filters
  function toggleQuickPrice(price: PriceFilter) {
    setFilters((prev) => ({
      ...prev,
      price: prev.price === price ? 'any' : price,
    }))
  }

  // Check if any non-default filter is active
  const isFiltered =
    selectedCategory !== 'all' ||
    filters.price !== 'any' ||
    filters.sort !== 'top_rated' ||
    filters.dietary !== 'all' ||
    worthItOnly

  function resetAllFilters() {
    setSelectedCategory('all')
    setFilters(DEFAULT_FILTERS)
    setWorthItOnly(false)
  }

  return (
    <div className="w-full max-w-5xl mx-auto min-h-dvh flex flex-col bg-app text-primary pb-8">
      {/* 1. Header: WorthIt Brand Wordmark + Tagline + Profile/Login */}
      <Header summary={summaryText} tagline="Hostel food. Honest opinions." />

      {/* 2. Search Bar + Filter Modal Trigger */}
      <div className="px-4 sm:px-6 pb-3.5">
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => navigate('/search')}
            aria-label="Search items"
            className="w-full h-12 flex items-center gap-3 pl-4 pr-12 rounded-full bg-card border border-border-subtle shadow-warm text-sm text-muted cursor-pointer active:scale-[0.99] transition-all hover:border-border-default focus-visible:outline-2 focus-visible:outline-accent"
          >
            <IconSearch
              size={19}
              stroke={1.8}
              className="text-secondary shrink-0"
            />
            <span className="truncate">Search items or drinks…</span>
          </button>

          {/* Filter icon button inside search bar */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Open filter options"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-elevated/80 border border-border-subtle flex items-center justify-center text-primary hover:bg-elevated active:scale-95 transition-all cursor-pointer"
          >
            <IconAdjustmentsHorizontal size={17} stroke={1.8} />
          </button>
        </div>
      </div>

      {/* Offline/Error banner with cached data */}
      {isError && items && items.length > 0 && (
        <div className="mx-4 sm:mx-6 mb-3 p-3 rounded-2xl bg-bad-bg border border-bad/20 flex items-center justify-between gap-2 text-xs text-bad">
          <div className="flex items-center gap-2 min-w-0 font-medium">
            <IconAlertCircle size={16} stroke={2} className="shrink-0" />
            <span className="truncate">
              Offline mode — showing cached tuck shop menu.
            </span>
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

      {/* Background Refreshing Indicator */}
      {isFetching && !isLoading && (
        <div className="flex justify-center items-center gap-1.5 py-1 text-xs text-secondary">
          <IconRefresh size={13} className="animate-spin text-accent" />
          <span>Refreshing menu…</span>
        </div>
      )}

      {/* ─── State 1: Loading State ─── */}
      {isLoading && (
        <div className="space-y-6 px-4 sm:px-6">
          {/* Skeleton Filter Chips */}
          <div className="flex items-center gap-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 rounded-full bg-card border border-border-subtle animate-pulse shrink-0"
              />
            ))}
          </div>

          {/* Skeleton Hero */}
          <SkeletonSpotlight />

          {/* Skeleton Category Chips */}
          <div className="flex items-center gap-2.5 overflow-hidden py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 rounded-2xl bg-card border border-border-subtle animate-pulse shrink-0"
              />
            ))}
          </div>

          {/* Skeleton Top Rated section */}
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-card animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              <SkeletonTopRatedCard />
              <SkeletonTopRatedCard />
              <SkeletonTopRatedCard />
            </div>
          </div>

          {/* Skeleton menu rows */}
          <div className="space-y-3 pt-2">
            <div className="h-4 w-28 rounded bg-card animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
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
            Couldn&apos;t load the tuck shop menu
          </h3>
          <p className="text-xs text-secondary max-w-xs mb-5">
            Please check your connection or hostel Wi-Fi and try again.
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
            Items added to the tuck shop menu will appear here for student
            reviews.
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
          {/* 3. Hero / Spotlight Banner */}
          {spotlightItem && (
            <section className="px-4 sm:px-6" aria-label="Featured item">
              <SpotlightCard item={spotlightItem} />
            </section>
          )}

          {/* 4. Visual Category Scroller with Icons */}
          <section className="space-y-2" aria-label="Menu categories">
            <div className="flex items-center justify-between px-4 sm:px-6">
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Categories
              </h2>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                >
                  Show all
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-4 sm:px-6 py-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat
                const visual = getCategoryVisual(cat === 'all' ? null : cat)
                const Icon = cat === 'all' ? IconToolsKitchen2 : visual.icon
                const label = cat === 'all' ? 'All Items' : formatCategory(cat)

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={isSelected}
                    className={`shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-xs transition-all select-none cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-card font-semibold shadow-warm active:scale-95'
                        : 'bg-card text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:bg-elevated active:scale-95 font-medium'
                    }`}
                  >
                    <Icon
                      size={16}
                      stroke={isSelected ? 2 : 1.75}
                      className={isSelected ? 'text-card' : visual.textClass}
                    />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 5. Quick Filter Chips */}
          <section className="space-y-2" aria-label="Quick filters">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 py-0.5">
              {/* Top Rated Chip */}
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    sort: prev.sort === 'top_rated' ? 'most_reviewed' : 'top_rated',
                  }))
                }
                aria-pressed={filters.sort === 'top_rated'}
                className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer ${
                  filters.sort === 'top_rated'
                    ? 'bg-accent text-card font-semibold shadow-warm active:scale-95'
                    : 'bg-card text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:scale-95'
                }`}
              >
                <IconStar size={13} stroke={2} />
                <span>Top rated</span>
              </button>

              {/* Under ₹30 */}
              <button
                type="button"
                onClick={() => toggleQuickPrice('under_30')}
                aria-pressed={filters.price === 'under_30'}
                className={`shrink-0 inline-flex items-center justify-center h-8 px-3.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer ${
                  filters.price === 'under_30'
                    ? 'bg-accent text-card font-semibold shadow-warm active:scale-95'
                    : 'bg-card text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:scale-95'
                }`}
              >
                Under ₹30
              </button>

              {/* Under ₹50 */}
              <button
                type="button"
                onClick={() => toggleQuickPrice('under_50')}
                aria-pressed={filters.price === 'under_50'}
                className={`shrink-0 inline-flex items-center justify-center h-8 px-3.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer ${
                  filters.price === 'under_50'
                    ? 'bg-accent text-card font-semibold shadow-warm active:scale-95'
                    : 'bg-card text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:scale-95'
                }`}
              >
                Under ₹50
              </button>

              {/* Worth It */}
              <button
                type="button"
                onClick={() => setWorthItOnly((prev) => !prev)}
                aria-pressed={worthItOnly}
                className={`shrink-0 inline-flex items-center justify-center h-8 px-3.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer ${
                  worthItOnly
                    ? 'bg-emerald-700 text-white font-semibold shadow-warm active:scale-95'
                    : 'bg-card text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:scale-95'
                }`}
              >
                👍 Worth it
              </button>

              {/* Veg Only */}
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    dietary: prev.dietary === 'veg_only' ? 'all' : 'veg_only',
                  }))
                }
                aria-pressed={filters.dietary === 'veg_only'}
                className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer ${
                  filters.dietary === 'veg_only'
                    ? 'bg-emerald-700 text-white font-semibold shadow-warm active:scale-95'
                    : 'bg-card text-secondary border border-border-subtle hover:border-border-default hover:text-primary active:scale-95'
                }`}
              >
                <IconLeaf size={13} stroke={2} />
                <span>Veg only</span>
              </button>

              {/* Filter Sheet Trigger */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                aria-label="More filters"
                className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-elevated text-primary border border-border-subtle hover:bg-card active:scale-95 transition-all cursor-pointer"
              >
                <span>More</span>
                <IconChevronDown size={14} stroke={2} />
              </button>
            </div>
          </section>

          {/* 6. Top Rated This Week — Horizontal Carousel with Rank Badges */}
          {topRatedItems.length > 0 && (
            <section className="space-y-3" aria-label="Top rated items">
              <div className="flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-1.5">
                  <IconFlame size={18} stroke={2.2} className="text-accent" />
                  <h2 className="text-sm sm:text-base font-bold text-primary tracking-tight">
                    Top Rated This Week
                  </h2>
                </div>
                <span className="text-xs text-secondary font-normal">
                  Community favorites
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 sm:px-6 pb-1">
                {topRatedItems.map((item, index) => (
                  <TopRatedCard
                    key={item.id}
                    item={item}
                    rank={index + 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 7. All Menu Items — Responsive Grid/List */}
          <section className="px-4 sm:px-6 space-y-3.5 pb-6" aria-label="Full menu list">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-primary tracking-tight">
                  {selectedCategory === 'all'
                    ? 'All Menu Items'
                    : `${formatCategory(selectedCategory)}`}
                  <span className="text-xs text-secondary font-normal ml-1.5">
                    ({filteredList.length})
                  </span>
                </h2>
                {isFiltered && (
                  <p className="text-[11px] text-muted">
                    Filtered by student criteria
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isFiltered && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary font-medium px-2.5 py-1 rounded-full bg-card border border-border-subtle cursor-pointer"
                >
                  <span className="capitalize">
                    Sort: {filters.sort.replace('_', ' ')}
                  </span>
                  <IconChevronDown size={13} stroke={2} />
                </button>
              </div>
            </div>

            {filteredList.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-card border border-border-subtle p-6 space-y-2">
                <p className="text-sm font-semibold text-primary">
                  No items match the selected filters
                </p>
                <p className="text-xs text-secondary max-w-xs mx-auto">
                  Try adjusting your price range or dietary filter to see more
                  tuck shop options.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-3 inline-flex items-center h-9 px-4 rounded-full bg-accent text-card text-xs font-semibold hover:bg-accent-hover shadow-warm cursor-pointer transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {filteredList.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Filter Bottom Sheet Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setIsFilterModalOpen(false)
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS)
          setIsFilterModalOpen(false)
        }}
      />
    </div>
  )
}

export default HomePage

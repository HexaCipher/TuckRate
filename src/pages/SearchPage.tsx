import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconArrowLeft,
  IconX,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react'
import { useItems } from '../hooks/useItems'
import ItemCard from '../components/ItemCard'
import SkeletonCard from '../components/SkeletonCard'

/**
 * Search screen (docs/3-App-Flow.md §7).
 * Fast lookup by item name and category.
 * Client-side live filter against loaded menu data.
 * All four states: success, loading, empty (no query / no match), error.
 */
function SearchPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const { data: items, isLoading, isError, refetch } = useItems()

  // Auto-focus input on screen entry (per App Flow §7)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Filter items in real time by name or category
  const filteredItems = useMemo(() => {
    if (!items) return []
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return items

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(trimmed) ||
        (item.category && item.category.toLowerCase().includes(trimmed))
    )
  }, [items, query])

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-dvh flex flex-col bg-app text-primary pb-8">
      {/* Header with Search Input and Back button */}
      <header className="sticky top-0 z-30 bg-app/95 backdrop-blur-xs px-4 pt-4 pb-2.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to home"
            className="w-10 h-10 flex items-center justify-center rounded-full text-secondary active:text-primary active:bg-card transition-colors cursor-pointer shrink-0"
          >
            <IconArrowLeft size={22} stroke={1.75} />
          </button>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-secondary">
              <IconSearch size={18} stroke={1.75} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items or categories..."
              className="w-full h-11 pl-10 pr-10 rounded-full bg-card border border-border-subtle shadow-warm text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none transition-all"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute inset-y-0 right-3 flex items-center justify-center text-muted hover:text-primary cursor-pointer"
              >
                <IconX size={16} stroke={2} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 px-4 pt-2">
        {/* State 1: Loading skeleton */}
        {isLoading && (
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* State 2: Error state */}
        {isError && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bad-bg border border-bad/20 text-bad flex items-center justify-center mb-4">
              <IconAlertCircle size={28} stroke={1.75} />
            </div>
            <h3 className="text-base font-semibold text-primary mb-1">
              Couldn&apos;t load the menu
            </h3>
            <p className="text-xs text-secondary max-w-xs mb-5">
              Please check your connection and try again.
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

        {/* State 3: Empty query results */}
        {!isLoading && !isError && items && filteredItems.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border-subtle shadow-warm flex items-center justify-center mb-4 text-secondary">
              <IconSearch size={28} stroke={1.5} />
            </div>
            <p className="text-sm font-semibold text-primary mb-1">
              No items match &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-secondary max-w-xs mb-4">
              Try searching with a different keyword like snacks, coffee, or maggi.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="inline-flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline cursor-pointer"
            >
              <IconRefresh size={14} />
              <span>Clear search</span>
            </button>
          </div>
        )}

        {/* State 4: Success list (with results count) */}
        {!isLoading && !isError && filteredItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pt-1 pb-0.5">
              <span className="text-xs text-secondary font-medium">
                {query.trim()
                  ? `${filteredItems.length} result${filteredItems.length !== 1 ? 's' : ''}`
                  : 'All menu items'}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default SearchPage

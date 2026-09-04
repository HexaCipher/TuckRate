import { useEffect } from 'react'
import {
  IconX,
  IconCheck,
  IconStar,
  IconMessage2,
  IconArrowUp,
  IconArrowDown,
  IconLeaf,
} from '@tabler/icons-react'

export type PriceFilter = 'any' | 'under_30' | 'under_50' | 'under_100'
export type SortFilter = 'top_rated' | 'most_reviewed' | 'price_asc' | 'price_desc'
export type DietaryFilter = 'all' | 'veg_only'

export interface FilterState {
  price: PriceFilter
  sort: SortFilter
  dietary: DietaryFilter
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onApply: (newFilters: FilterState) => void
  onReset: () => void
}

const PRICE_OPTIONS: { id: PriceFilter; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'under_30', label: 'Under ₹30' },
  { id: 'under_50', label: 'Under ₹50' },
  { id: 'under_100', label: 'Under ₹100' },
]

const SORT_OPTIONS: {
  id: SortFilter
  label: string
  icon: typeof IconStar
}[] = [
  { id: 'top_rated', label: 'Top rated', icon: IconStar },
  { id: 'most_reviewed', label: 'Most reviewed', icon: IconMessage2 },
  { id: 'price_asc', label: 'Price: Low to high', icon: IconArrowUp },
  { id: 'price_desc', label: 'Price: High to low', icon: IconArrowDown },
]

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}: FilterModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ESC key dismissal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[88dvh] overflow-y-auto overscroll-contain bg-card rounded-t-3xl sm:rounded-3xl border border-border-subtle shadow-warm-lg animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border-default/80" />
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <h2
                id="filter-modal-title"
                className="text-base sm:text-lg font-semibold text-primary"
              >
                Filter & Sort
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Find exactly what you want to eat
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-elevated transition-colors cursor-pointer"
            >
              <IconX size={18} stroke={2} />
            </button>
          </div>

          {/* 1. Price Range */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Price range
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRICE_OPTIONS.map((opt) => {
                const isSelected = filters.price === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onApply({ ...filters, price: opt.id })}
                    className={`h-9 px-3 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-card font-semibold shadow-warm'
                        : 'bg-elevated/70 text-secondary border border-border-subtle hover:border-border-default'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Dietary Preference */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Dietary
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApply({ ...filters, dietary: 'all' })}
                className={`flex-1 h-9 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filters.dietary === 'all'
                    ? 'bg-accent text-card font-semibold shadow-warm'
                    : 'bg-elevated/70 text-secondary border border-border-subtle hover:border-border-default'
                }`}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => onApply({ ...filters, dietary: 'veg_only' })}
                className={`flex-1 h-9 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  filters.dietary === 'veg_only'
                    ? 'bg-emerald-700 text-white font-semibold shadow-warm'
                    : 'bg-elevated/70 text-secondary border border-border-subtle hover:border-border-default'
                }`}
              >
                <IconLeaf size={14} stroke={2} />
                <span>Veg only</span>
              </button>
            </div>
          </div>

          {/* 3. Sort By */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Sort by
            </label>
            <div className="space-y-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = filters.sort === opt.id
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onApply({ ...filters, sort: opt.id })}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent-light/30 border-accent/40 text-primary font-semibold'
                        : 'bg-card border-border-subtle text-secondary hover:border-border-default'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        stroke={1.8}
                        className={isSelected ? 'text-accent' : 'text-muted'}
                      />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-accent text-card flex items-center justify-center">
                        <IconCheck size={12} stroke={2.5} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons — Integrated smoothly into the modal content flow with generous padding */}
          <div className="pt-3 pb-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="h-11 px-4 rounded-full text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-full bg-accent hover:bg-accent-hover text-card text-xs sm:text-sm font-semibold shadow-warm transition-all active:scale-[0.99] cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterModal

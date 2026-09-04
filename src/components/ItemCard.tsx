import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ItemStats } from '../types/database'
import StarRating from './StarRating'
import WorthItBadge from './WorthItBadge'
import CategoryPlaceholder from './CategoryPlaceholder'
import VegBadge from './VegBadge'

interface ItemCardProps {
  item: ItemStats
}

/**
 * Menu item row for the All Menu Items list.
 * Designed for 5–10 second scanning at the counter:
 * Thumbnail + Veg status, name, category, price, star rating, and worth-it consensus.
 */
export function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const hasRatings = item.rating_count > 0

  return (
    <button
      type="button"
      onClick={() => navigate(`/item/${item.id}`)}
      className="w-full flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-card border border-border-subtle shadow-warm text-left hover:border-border-default active:scale-[0.99] active:bg-elevated/80 transition-all cursor-pointer group focus-visible:outline-2 focus-visible:outline-accent"
    >
      {/* Left: Thumbnail with Category / Photo */}
      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-elevated shrink-0 border border-border-subtle relative">
        {item.photo_url && !imgError ? (
          <img
            src={item.photo_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <CategoryPlaceholder category={item.category} iconSize={24} />
        )}
      </div>

      {/* Middle: Details & Price */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <VegBadge isVeg={item.is_veg} size="sm" />
          <p className="text-sm font-semibold text-primary truncate leading-tight group-hover:text-accent transition-colors">
            {item.name}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs sm:text-sm font-bold text-primary tabular-nums">
            ₹{Number(item.price)}
          </span>
          {item.category && (
            <span className="text-[11px] text-secondary font-medium capitalize truncate">
              · {item.category}
            </span>
          )}
        </div>
      </div>

      {/* Right: Star Rating & Worth-It Pill */}
      <div className="flex flex-col items-end gap-1 shrink-0 pl-1">
        {hasRatings ? (
          <>
            <StarRating
              rating={Number(item.avg_stars)}
              count={item.rating_count}
              size="sm"
            />
            {item.worth_it_pct >= 70 && item.rating_count >= 2 ? (
              <span className="inline-flex items-center justify-center text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                👍 {item.worth_it_pct}%
              </span>
            ) : (
              <WorthItBadge
                worthItPct={item.worth_it_pct}
                ratingCount={item.rating_count}
                size="sm"
              />
            )}
          </>
        ) : (
          <span className="inline-flex items-center justify-center text-[11px] text-muted font-medium bg-elevated px-2 py-0.5 rounded-full border border-border-subtle">
            Not rated yet
          </span>
        )}
      </div>
    </button>
  )
}

export default ItemCard

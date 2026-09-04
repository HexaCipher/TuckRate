import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ItemStats } from '../types/database'
import StarRating from './StarRating'
import CategoryPlaceholder from './CategoryPlaceholder'
import VegBadge from './VegBadge'

interface TopRatedCardProps {
  item: ItemStats
  rank?: number
}

/**
 * Discovery card for the "Top Rated This Week" horizontal carousel.
 * Features rank badge (#1, #2, #3), photo/category visual, veg status,
 * price, rating, and worth-it consensus.
 */
export function TopRatedCard({ item, rank }: TopRatedCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const hasRatings = item.rating_count > 0

  return (
    <button
      type="button"
      onClick={() => navigate(`/item/${item.id}`)}
      className="w-[150px] sm:w-[165px] shrink-0 text-left rounded-2xl bg-card border border-border-subtle shadow-warm overflow-hidden active:scale-[0.97] transition-all cursor-pointer group hover:border-border-default focus-visible:outline-2 focus-visible:outline-accent"
    >
      {/* Thumbnail area with floating badges */}
      <div className="relative w-full h-26 overflow-hidden bg-elevated">
        {item.photo_url && !imgError ? (
          <img
            src={item.photo_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <CategoryPlaceholder category={item.category} iconSize={32} />
        )}

        {/* Rank badge (#1, #2, #3) */}
        {rank !== undefined && (
          <span className="absolute top-2 left-2 z-10 inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-lg bg-amber-500/95 text-white text-[11px] font-bold shadow-warm">
            #{rank}
          </span>
        )}

        {/* Veg / Non-veg dot in top right */}
        <span className="absolute top-2 right-2 z-10">
          <VegBadge isVeg={item.is_veg} size="sm" />
        </span>

        {/* Rating overlay badge at bottom of image if rated */}
        {hasRatings && (
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
              ★ {Number(item.avg_stars).toFixed(1)}
              <span className="text-white/70 font-normal">({item.rating_count})</span>
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 space-y-1.5">
        <p
          className="text-xs font-semibold text-primary truncate leading-tight group-hover:text-accent transition-colors"
          title={item.name}
        >
          {item.name}
        </p>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs font-bold text-primary tabular-nums">
            ₹{Number(item.price)}
          </span>

          {hasRatings ? (
            item.worth_it_pct >= 70 ? (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                👍 {item.worth_it_pct}%
              </span>
            ) : (
              <StarRating
                rating={Number(item.avg_stars)}
                count={item.rating_count}
                size="sm"
                showCount={false}
              />
            )
          ) : (
            <span className="text-[10px] font-medium text-muted bg-elevated px-1.5 py-0.5 rounded-md">
              New
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default TopRatedCard

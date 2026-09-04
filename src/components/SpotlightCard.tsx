import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconFlame } from '@tabler/icons-react'
import type { ItemStats } from '../types/database'
import StarRating from './StarRating'
import WorthItBadge from './WorthItBadge'
import CategoryPlaceholder from './CategoryPlaceholder'

interface SpotlightCardProps {
  item: ItemStats
}

/**
 * Spotlight card for this week's top-rated item.
 * Photo, name, rating badge, tapping navigates to item detail.
 * Explicitly NO CTA button, NO "Order Now" per design-system.md.
 */
function SpotlightCard({ item }: SpotlightCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      onClick={() => navigate(`/item/${item.id}`)}
      className="w-full text-left rounded-2xl bg-card border border-border-subtle shadow-warm overflow-hidden active:scale-[0.99] transition-all cursor-pointer group"
    >
      {/* Photo or placeholder with floating badges */}
      <div className="relative w-full h-36 overflow-hidden bg-elevated">
        {item.photo_url && !imgError ? (
          <img
            src={item.photo_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <CategoryPlaceholder category={item.category} iconSize={36} />
        )}

        {/* Floating badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-xs text-accent text-[11px] font-semibold shadow-warm">
            <IconFlame size={13} stroke={2.2} className="text-accent" />
            <span>Top rated this week</span>
          </span>

          {item.category && (
            <span className="px-2 py-0.5 rounded-full bg-card/85 backdrop-blur-xs text-secondary text-[10px] font-medium capitalize shadow-warm">
              {item.category}
            </span>
          )}
        </div>
      </div>

      {/* Item info row */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-primary truncate leading-snug">
            {item.name}
          </p>
          <p className="text-xs font-semibold text-secondary mt-0.5 tabular-nums">
            ₹{Number(item.price)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StarRating rating={Number(item.avg_stars)} count={item.rating_count} size="sm" />
          <WorthItBadge worthItPct={item.worth_it_pct} ratingCount={item.rating_count} />
        </div>
      </div>
    </button>
  )
}

export default SpotlightCard

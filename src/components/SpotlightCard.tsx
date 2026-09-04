import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconFlame, IconArrowRight, IconSparkles } from '@tabler/icons-react'
import type { ItemStats } from '../types/database'
import StarRating from './StarRating'
import WorthItBadge from './WorthItBadge'
import CategoryPlaceholder from './CategoryPlaceholder'
import VegBadge from './VegBadge'

interface SpotlightCardProps {
  item: ItemStats
}

/**
 * Hero Banner for the featured / top-rated item.
 * Delivers immediate decision value per Prompt Phase 10:
 * Item, price, veg status, star rating, review count, worth-it percentage.
 * Gracefully handles unrated items without showing broken "★ — (0)".
 */
export function SpotlightCard({ item }: SpotlightCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const hasRatings = item.rating_count > 0
  const isHighWorthIt = item.worth_it_pct >= 70 && item.rating_count >= 2

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/item/${item.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/item/${item.id}`)
        }
      }}
      className="w-full text-left rounded-3xl bg-gradient-to-br from-[#FFFDF8] via-[#FFF9F0] to-[#FCEEE2] border border-[#EFE2D2] shadow-warm-md overflow-hidden active:scale-[0.99] transition-all cursor-pointer group focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left Side: Context & Decision Info */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Top Pill / Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasRatings ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-[11px] font-semibold shadow-warm">
                <IconFlame size={13} stroke={2.5} />
                <span>Top rated this week</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-[11px] font-semibold shadow-warm">
                <IconSparkles size={13} stroke={2.2} />
                <span>Featured today</span>
              </span>
            )}

            {item.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-card/90 text-secondary border border-border-subtle text-[11px] font-medium capitalize">
                {item.category}
              </span>
            )}
          </div>

          {/* Title & Price */}
          <div>
            <div className="flex items-center gap-2">
              <VegBadge isVeg={item.is_veg} size="sm" />
              <h3 className="text-base sm:text-lg font-bold text-primary truncate leading-tight group-hover:text-accent transition-colors">
                {item.name}
              </h3>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
                ₹{Number(item.price)}
              </span>
              <span className="text-[11px] text-muted font-normal">
                at tuck shop
              </span>
            </div>
          </div>

          {/* Rating & Worth-it row */}
          {hasRatings ? (
            <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
              <StarRating
                rating={Number(item.avg_stars)}
                count={item.rating_count}
                size="sm"
              />
              <WorthItBadge
                worthItPct={item.worth_it_pct}
                ratingCount={item.rating_count}
              />
              {isHighWorthIt && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  👍 {item.worth_it_pct}% say worth it
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[11px] text-secondary font-medium bg-card/80 px-2.5 py-1 rounded-full border border-border-subtle">
                Not yet rated · Be the first to try
              </span>
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-1 flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
            <span>{hasRatings ? 'View ratings & reviews' : 'Rate this item'}</span>
            <IconArrowRight size={14} stroke={2.2} />
          </div>
        </div>

        {/* Right Side: Visual Graphic or Photo */}
        <div className="w-full sm:w-36 sm:h-36 h-28 rounded-2xl overflow-hidden bg-elevated border border-border-subtle shrink-0 relative">
          {item.photo_url && !imgError ? (
            <img
              src={item.photo_url}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <CategoryPlaceholder category={item.category} iconSize={40} />
          )}
        </div>
      </div>
    </div>
  )
}

export default SpotlightCard

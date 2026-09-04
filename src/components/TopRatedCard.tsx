import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ItemStats } from '../types/database'
import StarRating from './StarRating'
import CategoryPlaceholder from './CategoryPlaceholder'

interface TopRatedCardProps {
  item: ItemStats
}

/**
 * Card for the "Top Rated" horizontal scroll row.
 * Photo, name, price, rating badge. NO add/plus button.
 */
function TopRatedCard({ item }: TopRatedCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      onClick={() => navigate(`/item/${item.id}`)}
      className="w-[140px] shrink-0 text-left rounded-2xl bg-card border border-border-subtle shadow-warm overflow-hidden active:scale-[0.97] transition-all cursor-pointer group"
    >
      {/* Photo or placeholder */}
      <div className="w-full h-22 overflow-hidden bg-elevated">
        {item.photo_url && !imgError ? (
          <img
            src={item.photo_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <CategoryPlaceholder category={item.category} iconSize={28} />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-semibold text-primary truncate leading-tight" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-semibold text-secondary tabular-nums">
            ₹{Number(item.price)}
          </span>
          <StarRating rating={Number(item.avg_stars)} count={item.rating_count} size="sm" showCount={false} />
        </div>
      </div>
    </button>
  )
}

export default TopRatedCard

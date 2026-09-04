import { useNavigate } from 'react-router-dom'
import type { ItemStats } from '../types/database'
import StarRating from './StarRating'
import WorthItBadge from './WorthItBadge'

interface ItemCardProps {
  item: ItemStats
}

/**
 * Vertical item row for the Full Menu list.
 * Name + price left, star rating + worth-it badge right.
 * Per design-system.md: #FFFBF5 surface, 16px radius, soft warm shadow.
 */
function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/item/${item.id}`)}
      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border-subtle shadow-warm text-left hover:border-border-default active:scale-[0.99] active:bg-elevated transition-all min-h-[60px] cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary truncate leading-snug">
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
    </button>
  )
}

export default ItemCard

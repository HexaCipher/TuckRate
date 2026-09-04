import { getCategoryVisual } from '../lib/categories'

interface CategoryPlaceholderProps {
  category: string | null
  className?: string
  iconSize?: number
}

/**
 * Soft category-tinted placeholder tile per .agents/rules/design-system.md §Photography:
 * Renders an appetizing, warm-tinted tile with an appropriate food icon
 * when no user photo has been uploaded.
 */
export function CategoryPlaceholder({
  category,
  className = 'w-full h-full',
  iconSize = 28,
}: CategoryPlaceholderProps) {
  const visual = getCategoryVisual(category)
  const Icon = visual.icon

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${visual.bgClass} ${visual.textClass} ${className}`}
      aria-hidden="true"
    >
      <Icon size={iconSize} stroke={1.5} />
    </div>
  )
}

export default CategoryPlaceholder

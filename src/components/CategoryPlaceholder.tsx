import {
  IconCoffee,
  IconCookie,
  IconSoup,
  IconToolsKitchen2,
} from '@tabler/icons-react'

interface CategoryPlaceholderProps {
  category: string | null
  className?: string
  iconSize?: number
}

interface CategoryVisual {
  bgClass: string
  textClass: string
  icon: typeof IconToolsKitchen2
  label: string
}

function getCategoryVisual(category: string | null): CategoryVisual {
  const normalized = category?.toLowerCase().trim()

  switch (normalized) {
    case 'snacks':
      return {
        bgClass: 'bg-[#F9EBDC]',
        textClass: 'text-[#B86E36]',
        icon: IconCookie,
        label: 'Snacks',
      }
    case 'meals':
      return {
        bgClass: 'bg-[#F8E5DF]',
        textClass: 'text-[#C1502E]',
        icon: IconSoup,
        label: 'Meals',
      }
    case 'beverages':
      return {
        bgClass: 'bg-[#EAF1EA]',
        textClass: 'text-[#487853]',
        icon: IconCoffee,
        label: 'Beverages',
      }
    default:
      return {
        bgClass: 'bg-[#F2E8DA]',
        textClass: 'text-[#8C7F73]',
        icon: IconToolsKitchen2,
        label: category || 'Food',
      }
  }
}

/**
 * Soft category-tinted placeholder tile per .agents/rules/design-system.md §Photography:
 * "If an item has no photo yet, render a soft category-tinted placeholder tile
 * — never a broken image or plain gray box."
 */
function CategoryPlaceholder({ category, className = 'w-full h-full', iconSize = 28 }: CategoryPlaceholderProps) {
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

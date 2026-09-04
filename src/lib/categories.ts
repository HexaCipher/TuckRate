import {
  IconBottle,
  IconBread,
  IconBurger,
  IconCoffee,
  IconCookie,
  IconCup,
  IconFlame,
  IconGlassFull,
  IconPackage,
  IconPizza,
  IconSoup,
  IconToolsKitchen2,
} from '@tabler/icons-react'

export interface CategoryVisual {
  bgClass: string
  textClass: string
  icon: typeof IconToolsKitchen2
  label: string
}

export function getCategoryVisual(category: string | null): CategoryVisual {
  const normalized = category?.toLowerCase().trim() || ''

  if (normalized.includes('shake')) {
    return {
      bgClass: 'bg-[#FDF0E6]',
      textClass: 'text-[#C1502E]',
      icon: IconCup,
      label: 'Shakes',
    }
  }

  if (normalized.includes('juice')) {
    return {
      bgClass: 'bg-[#FEF3D6]',
      textClass: 'text-[#B88728]',
      icon: IconGlassFull,
      label: 'Juice',
    }
  }

  if (normalized.includes('starter')) {
    return {
      bgClass: 'bg-[#F9EBDC]',
      textClass: 'text-[#B86E36]',
      icon: IconFlame,
      label: 'Starters',
    }
  }

  if (normalized.includes('burger')) {
    return {
      bgClass: 'bg-[#FBEBD9]',
      textClass: 'text-[#B56728]',
      icon: IconBurger,
      label: 'Burger',
    }
  }

  if (normalized.includes('pizza')) {
    return {
      bgClass: 'bg-[#FCEAE6]',
      textClass: 'text-[#C14F3D]',
      icon: IconPizza,
      label: 'Pizza',
    }
  }

  if (normalized.includes('patty')) {
    return {
      bgClass: 'bg-[#F8EFE0]',
      textClass: 'text-[#9A6732]',
      icon: IconCookie,
      label: 'Patty',
    }
  }

  if (normalized.includes('sandwich')) {
    return {
      bgClass: 'bg-[#F5EFE6]',
      textClass: 'text-[#876543]',
      icon: IconBread,
      label: 'Sandwich',
    }
  }

  if (normalized.includes('momo')) {
    return {
      bgClass: 'bg-[#FCECE8]',
      textClass: 'text-[#BC5244]',
      icon: IconSoup,
      label: 'Momos',
    }
  }

  if (
    normalized.includes('maggi') ||
    normalized.includes('pasta') ||
    normalized.includes('noodle')
  ) {
    return {
      bgClass: 'bg-[#FDF2D9]',
      textClass: 'text-[#B47C1B]',
      icon: IconSoup,
      label: 'Maggi',
    }
  }

  if (
    normalized.includes('prantha') ||
    normalized.includes('bread') ||
    normalized.includes('naan')
  ) {
    return {
      bgClass: 'bg-[#F6EEE1]',
      textClass: 'text-[#916B3E]',
      icon: IconBread,
      label: 'Prantha',
    }
  }

  if (normalized.includes('combo')) {
    return {
      bgClass: 'bg-[#F9ECE7]',
      textClass: 'text-[#C1502E]',
      icon: IconPackage,
      label: 'Combo',
    }
  }

  if (
    normalized.includes('beverage') ||
    normalized.includes('drink') ||
    normalized.includes('cold drink')
  ) {
    return {
      bgClass: 'bg-[#EAF1EA]',
      textClass: 'text-[#487853]',
      icon: IconBottle,
      label: 'Drinks',
    }
  }

  if (normalized.includes('coffee') || normalized.includes('tea')) {
    return {
      bgClass: 'bg-[#F3EFE9]',
      textClass: 'text-[#6F5747]',
      icon: IconCoffee,
      label: 'Beverages',
    }
  }

  return {
    bgClass: 'bg-[#F2E8DA]',
    textClass: 'text-[#8C7F73]',
    icon: IconToolsKitchen2,
    label: category || 'Food',
  }
}

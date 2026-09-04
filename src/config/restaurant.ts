/**
 * Static restaurant/tuck-shop configuration.
 *
 * v1 supports a single vendor only — this is hard-coded rather than stored
 * in the database. If multi-vendor support is ever needed (out of v1 scope),
 * this would move to a `shops` table.
 */
export const RESTAURANT = {
  name: 'Saini Fast Food',
  contact: ['+919592694243', '+918360124450'] as const,
  mealsServed: ['Breakfast', 'Lunch', 'Dinner'] as const,
  prepTimeNotice:
    'Please wait for 10-15 minutes after order for better preparation',
} as const

export type Restaurant = typeof RESTAURANT

/** Shared emoji icons for expense categories. */
export const CATEGORY_ICONS = [
  '💳',
  '🛒',
  '🏠',
  '🚗',
  '🍔',
  '🍽️',
  '☕',
  '💊',
  '👕',
  '⚽',
  '🧴',
  '💅',
  '👶',
  '🎮',
  '✈️',
  '📱',
  '💡',
  '🎁',
  '📚',
  '🔧',
  '🐶',
] as const

export type CategoryIcon = (typeof CATEGORY_ICONS)[number]

export const DEFAULT_CATEGORY_ICON: CategoryIcon = '💳'

/** Seed pack for first-time finances users (i18n keys under finances.defaults.*). */
export const DEFAULT_CATEGORY_SEEDS: { nameKey: string; icon: CategoryIcon }[] = [
  { nameKey: 'finances.defaults.groceries', icon: '🛒' },
  { nameKey: 'finances.defaults.household', icon: '🧴' },
  { nameKey: 'finances.defaults.medicine', icon: '💊' },
  { nameKey: 'finances.defaults.sport', icon: '⚽' },
  { nameKey: 'finances.defaults.education', icon: '📚' },
  { nameKey: 'finances.defaults.transport', icon: '🚗' },
  { nameKey: 'finances.defaults.gifts', icon: '🎁' },
  { nameKey: 'finances.defaults.restaurants', icon: '🍽️' },
  { nameKey: 'finances.defaults.home', icon: '🏠' },
  { nameKey: 'finances.defaults.clothes', icon: '👕' },
]

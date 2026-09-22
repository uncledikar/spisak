export const ITEM_COLORS = [
  { id: 'mint' },
  { id: 'peach' },
  { id: 'lemon' },
  { id: 'sky' },
  { id: 'lilac' },
  { id: 'rose' },
  { id: 'sand' },
] as const

export type ItemColorId = (typeof ITEM_COLORS)[number]['id']

export function isItemColorId(value: string | null | undefined): value is ItemColorId {
  return ITEM_COLORS.some((c) => c.id === value)
}

/** CSS class for themed item tint background. */
export function itemTintClass(color: string | null | undefined): string | undefined {
  if (!isItemColorId(color)) return undefined
  return `item-tint-${color}`
}

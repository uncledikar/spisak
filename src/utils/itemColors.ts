export const ITEM_COLORS = [
  { id: 'mint', value: '#e6f4ec' },
  { id: 'peach', value: '#fceee6' },
  { id: 'lemon', value: '#f6f4dc' },
  { id: 'sky', value: '#e7f1f8' },
  { id: 'lilac', value: '#efeaf6' },
  { id: 'rose', value: '#f8e9ec' },
  { id: 'sand', value: '#f3efe6' },
] as const

export type ItemColorId = (typeof ITEM_COLORS)[number]['id']

export function isItemColorId(value: string | null | undefined): value is ItemColorId {
  return ITEM_COLORS.some((c) => c.id === value)
}

export function itemColorValue(color: string | null | undefined): string | undefined {
  if (!color) return undefined
  return ITEM_COLORS.find((c) => c.id === color)?.value
}

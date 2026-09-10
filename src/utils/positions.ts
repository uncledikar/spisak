import type { ListItem, TemplateItem } from '../db/types'

type Positioned = { position?: number | null }

export function compareByPosition(a: Positioned, b: Positioned): number {
  const pa = a.position ?? Number.MAX_SAFE_INTEGER
  const pb = b.position ?? Number.MAX_SAFE_INTEGER
  return pa - pb
}

/** Sort by position; fill missing positions without renumbering existing ones yet. */
export function sortByPosition<T extends Positioned>(items: T[]): T[] {
  return [...items].sort(compareByPosition)
}

/** Assign contiguous positions 0..n-1 in current array order. */
export function reindexPositions<T extends Positioned>(items: T[]): (T & { position: number })[] {
  return items.map((item, index) => ({ ...item, position: index }))
}

/** Ensure every item has position and list is sorted. */
export function normalizeItemPositions(items: ListItem[]): ListItem[] {
  const needsReindex = items.some(
    (item) => typeof item.position !== 'number' || !Number.isFinite(item.position),
  )
  if (needsReindex) return reindexPositions(sortByPosition(items))
  return sortByPosition(items)
}

export function normalizeTemplatePositions(items: TemplateItem[]): TemplateItem[] {
  const needsReindex = items.some(
    (item) => typeof item.position !== 'number' || !Number.isFinite(item.position),
  )
  if (needsReindex) return reindexPositions(sortByPosition(items))
  return sortByPosition(items)
}

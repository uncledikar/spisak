import type { ListItem, ListRecord } from '../types/models'
import { createId } from '../../../shared/utils/id'

type Positioned = { position?: number | null }

export function compareByPosition(a: Positioned, b: Positioned): number {
  const pa = a.position ?? Number.MAX_SAFE_INTEGER
  const pb = b.position ?? Number.MAX_SAFE_INTEGER
  return pa - pb
}

export function sortByPosition<T extends Positioned>(items: T[]): T[] {
  return [...items].sort(compareByPosition)
}

export function reindexPositions<T extends Positioned>(items: T[]): (T & { position: number })[] {
  return items.map((item, index) => ({ ...item, position: index }))
}

function uniqueId(candidate: unknown, used: Set<string>): string {
  if (typeof candidate === 'string' && candidate.length > 0 && !used.has(candidate)) {
    used.add(candidate)
    return candidate
  }
  const id = createId()
  used.add(id)
  return id
}

/** Normalize one list item from any older schema shape. */
export function normalizeListItem(
  raw: Partial<ListItem> | null | undefined,
  index: number,
  usedIds: Set<string> = new Set(),
): ListItem {
  const item = raw ?? {}
  const quantity = Number(item.quantity)
  return {
    id: uniqueId(item.id, usedIds),
    name: typeof item.name === 'string' ? item.name : '',
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    comment: typeof item.comment === 'string' ? item.comment : '',
    checked: Boolean(item.checked),
    color: typeof item.color === 'string' ? item.color : null,
    position:
      typeof item.position === 'number' && Number.isFinite(item.position)
        ? item.position
        : index,
  }
}

export function normalizeItemPositions(items: ListItem[] | null | undefined): ListItem[] {
  const raw = Array.isArray(items) ? items : []
  const usedIds = new Set<string>()
  const normalized = raw.map((item, index) => normalizeListItem(item, index, usedIds))
  return reindexPositions(sortByPosition(normalized))
}

export function normalizeListRecord(list: ListRecord): ListRecord {
  const position = typeof list.position === 'number' && Number.isFinite(list.position) ? list.position : 0
  return {
    ...list,
    name: typeof list.name === 'string' ? list.name : '',
    deadline: list.deadline ?? null,
    trackQuantity: list.trackQuantity !== false,
    position,
    deletedAt: list.deletedAt ?? null,
    createdAt: typeof list.createdAt === 'number' ? list.createdAt : Date.now(),
    updatedAt: typeof list.updatedAt === 'number' ? list.updatedAt : Date.now(),
    items: normalizeItemPositions(list.items),
  }
}

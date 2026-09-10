import type { ListItem, ListRecord, TemplateItem, TemplateRecord } from '../db/types'
import { createId } from './id'

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

export function normalizeTemplateItem(
  raw: Partial<TemplateItem> | null | undefined,
  index: number,
  usedIds: Set<string> = new Set(),
): TemplateItem {
  const item = raw ?? {}
  const quantity = Number(item.quantity)
  return {
    id: uniqueId(item.id, usedIds),
    name: typeof item.name === 'string' ? item.name : '',
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    comment: typeof item.comment === 'string' ? item.comment : '',
    color: typeof item.color === 'string' ? item.color : null,
    position:
      typeof item.position === 'number' && Number.isFinite(item.position)
        ? item.position
        : index,
  }
}

export function normalizeTemplatePositions(
  items: TemplateItem[] | null | undefined,
): TemplateItem[] {
  const raw = Array.isArray(items) ? items : []
  const usedIds = new Set<string>()
  const normalized = raw.map((item, index) => normalizeTemplateItem(item, index, usedIds))
  return reindexPositions(sortByPosition(normalized))
}

export function normalizeListRecord(list: ListRecord): ListRecord {
  return {
    ...list,
    name: typeof list.name === 'string' ? list.name : '',
    deadline: list.deadline ?? null,
    trackQuantity: list.trackQuantity !== false,
    deletedAt: list.deletedAt ?? null,
    createdAt: typeof list.createdAt === 'number' ? list.createdAt : Date.now(),
    updatedAt: typeof list.updatedAt === 'number' ? list.updatedAt : Date.now(),
    items: normalizeItemPositions(list.items),
  }
}

export function normalizeTemplateRecord(template: TemplateRecord): TemplateRecord {
  return {
    ...template,
    name: typeof template.name === 'string' ? template.name : '',
    trackQuantity: template.trackQuantity !== false,
    createdAt: typeof template.createdAt === 'number' ? template.createdAt : Date.now(),
    updatedAt: typeof template.updatedAt === 'number' ? template.updatedAt : Date.now(),
    items: normalizeTemplatePositions(template.items),
  }
}

export function listNeedsPersist(before: ListRecord, after: ListRecord): boolean {
  if (before.trackQuantity !== after.trackQuantity) return true
  if (!Array.isArray(before.items)) return true
  if (before.items.length !== after.items.length) return true
  return after.items.some((item, i) => {
    const prev = before.items[i]
    if (!prev) return true
    return (
      prev.position !== item.position ||
      prev.color !== item.color ||
      typeof prev.quantity !== 'number' ||
      typeof prev.checked !== 'boolean' ||
      typeof prev.id !== 'string'
    )
  })
}

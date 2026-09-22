import type { ListItem, ListRecord } from '../types/models'
import { normalizeListRecord } from '../utils/positions'
import { toEpochMs } from '../../../shared/api/auth'

export type ListRow = {
  id: string
  name: string
  deadline: string | null
  track_quantity: boolean
  position: number | null
  items: ListItem[] | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export function mapListRow(row: ListRow): ListRecord {
  return normalizeListRecord({
    id: row.id,
    name: row.name,
    deadline: row.deadline,
    trackQuantity: row.track_quantity,
    position: typeof row.position === 'number' ? row.position : 0,
    items: Array.isArray(row.items) ? row.items : [],
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
    updatedAt: toEpochMs(row.updated_at) ?? Date.now(),
    deletedAt: toEpochMs(row.deleted_at),
  })
}

export function listToRow(list: ListRecord, userId: string) {
  return {
    id: list.id,
    user_id: userId,
    name: list.name,
    deadline: list.deadline,
    track_quantity: list.trackQuantity,
    position: list.position,
    items: list.items,
    created_at: new Date(list.createdAt).toISOString(),
    updated_at: new Date(list.updatedAt).toISOString(),
    deleted_at: list.deletedAt == null ? null : new Date(list.deletedAt).toISOString(),
  }
}

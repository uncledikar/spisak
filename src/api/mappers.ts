import type { ListItem, ListLink, ListRecord, TemplateItem, TemplateRecord } from '../types/models'
import { normalizeListRecord, normalizeTemplateRecord } from '../utils/positions'
import { toEpochMs } from './auth'

export type ListRow = {
  id: string
  name: string
  deadline: string | null
  track_quantity: boolean
  items: ListItem[] | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type TemplateRow = {
  id: string
  name: string
  track_quantity: boolean
  items: TemplateItem[] | null
  created_at: string
  updated_at: string
}

export type LinkRow = {
  id: string
  list_id_a: string
  list_id_b: string
  created_at: string
}

export function mapListRow(row: ListRow): ListRecord {
  return normalizeListRecord({
    id: row.id,
    name: row.name,
    deadline: row.deadline,
    trackQuantity: row.track_quantity,
    items: Array.isArray(row.items) ? row.items : [],
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
    updatedAt: toEpochMs(row.updated_at) ?? Date.now(),
    deletedAt: toEpochMs(row.deleted_at),
  })
}

export function mapTemplateRow(row: TemplateRow): TemplateRecord {
  return normalizeTemplateRecord({
    id: row.id,
    name: row.name,
    trackQuantity: row.track_quantity,
    items: Array.isArray(row.items) ? row.items : [],
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
    updatedAt: toEpochMs(row.updated_at) ?? Date.now(),
  })
}

export function mapLinkRow(row: LinkRow): ListLink {
  return {
    id: row.id,
    listIdA: row.list_id_a,
    listIdB: row.list_id_b,
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
  }
}

export function listToRow(list: ListRecord, userId: string) {
  return {
    id: list.id,
    user_id: userId,
    name: list.name,
    deadline: list.deadline,
    track_quantity: list.trackQuantity,
    items: list.items,
    created_at: new Date(list.createdAt).toISOString(),
    updated_at: new Date(list.updatedAt).toISOString(),
    deleted_at: list.deletedAt == null ? null : new Date(list.deletedAt).toISOString(),
  }
}

export function templateToRow(template: TemplateRecord, userId: string) {
  return {
    id: template.id,
    user_id: userId,
    name: template.name,
    track_quantity: template.trackQuantity,
    items: template.items,
    created_at: new Date(template.createdAt).toISOString(),
    updated_at: new Date(template.updatedAt).toISOString(),
  }
}

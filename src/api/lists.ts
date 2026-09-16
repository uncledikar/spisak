import { bumpData } from '../store/dataStore'
import type { ListItem, ListRecord } from '../types/models'
import { createId } from '../utils/id'
import { normalizeListRecord, reindexPositions } from '../utils/positions'
import { requireUserId } from './auth'
import { listToRow, mapListRow, type ListRow } from './mappers'
import { supabase } from '../lib/supabase'

export async function getActiveLists(): Promise<ListRecord[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as ListRow[]).map(mapListRow)
}

export async function getTrashLists(): Promise<ListRecord[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) throw error
  return (data as ListRow[]).map(mapListRow)
}

export async function getList(id: string): Promise<ListRecord | null> {
  try {
    const { data, error } = await supabase.from('lists').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapListRow(data as ListRow)
  } catch (error) {
    console.error('getList failed', id, error)
    return null
  }
}

export async function createList(input: {
  name: string
  deadline: string | null
  trackQuantity: boolean
  items: ListItem[]
}): Promise<ListRecord> {
  const userId = await requireUserId()
  const now = Date.now()
  const list = normalizeListRecord({
    id: createId(),
    name: input.name.trim() || 'Untitled',
    deadline: input.deadline,
    trackQuantity: input.trackQuantity,
    items: reindexPositions(input.items),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })

  const { error } = await supabase.from('lists').insert(listToRow(list, userId))
  if (error) throw error
  bumpData()
  return list
}

export async function copyList(id: string, name: string): Promise<ListRecord | null> {
  const source = await getList(id)
  if (!source || source.deletedAt !== null) return null

  return createList({
    name,
    deadline: source.deadline,
    trackQuantity: source.trackQuantity,
    items: source.items.map((item, index) => ({
      id: createId(),
      name: item.name,
      quantity: item.quantity,
      comment: item.comment,
      color: item.color,
      checked: false,
      position: index,
    })),
  })
}

export async function updateList(
  id: string,
  patch: Partial<Pick<ListRecord, 'name' | 'deadline' | 'items' | 'trackQuantity'>>,
): Promise<ListRecord | null> {
  const existing = await getList(id)
  if (!existing || existing.deletedAt !== null) return null

  const items =
    patch.items !== undefined
      ? reindexPositions(
          patch.items.map((item, i) => ({
            ...item,
            position: item.position ?? i,
          })),
        )
      : existing.items

  const updated = normalizeListRecord({
    ...existing,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() || existing.name : existing.name,
    trackQuantity:
      patch.trackQuantity !== undefined ? patch.trackQuantity : existing.trackQuantity,
    items,
    updatedAt: Date.now(),
  })

  const userId = await requireUserId()
  const { error } = await supabase.from('lists').update(listToRow(updated, userId)).eq('id', id)
  if (error) throw error
  bumpData()
  return updated
}

export async function softDeleteList(id: string): Promise<void> {
  const existing = await getList(id)
  if (!existing) return
  const now = Date.now()
  const { error } = await supabase
    .from('lists')
    .update({
      deleted_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  bumpData()
}

export async function restoreList(id: string): Promise<void> {
  const existing = await getList(id)
  if (!existing) return
  const now = Date.now()
  const { error } = await supabase
    .from('lists')
    .update({
      deleted_at: null,
      updated_at: new Date(now).toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  bumpData()
}

export async function purgeList(id: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
  bumpData()
}

export function emptyItem(position = 0): ListItem {
  return {
    id: createId(),
    name: '',
    quantity: 1,
    comment: '',
    checked: false,
    color: null,
    position,
  }
}

import { bumpData } from '../store/dataStore'
import type { ListItem, ListRecord, TemplateItem, TemplateRecord } from '../types/models'
import { createId } from '../utils/id'
import { normalizeLinkPair } from '../utils/links'
import {
  normalizeListRecord,
  normalizeTemplateRecord,
  reindexPositions,
} from '../utils/positions'
import { requireUserId } from './auth'
import { listToRow, mapLinkRow, mapListRow, mapTemplateRow, templateToRow, type ListRow, type TemplateRow } from './mappers'
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

export async function createListFromTemplate(
  templateId: string,
  name?: string,
): Promise<ListRecord | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const template = mapTemplateRow(data as TemplateRow)
  return createList({
    name: name?.trim() || template.name,
    deadline: null,
    trackQuantity: template.trackQuantity,
    items: template.items.map((item, index) => ({
      id: createId(),
      name: item.name,
      quantity: item.quantity,
      comment: item.comment,
      color: item.color ?? null,
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
  // list_links cascade on list delete
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
  bumpData()
}

export async function saveListAsTemplate(listId: string): Promise<TemplateRecord | null> {
  const list = await getList(listId)
  if (!list || list.deletedAt !== null) return null

  const userId = await requireUserId()
  const now = Date.now()
  const template = normalizeTemplateRecord({
    id: createId(),
    name: list.name,
    trackQuantity: list.trackQuantity,
    items: list.items.map(
      (item, index): TemplateItem => ({
        id: createId(),
        name: item.name,
        quantity: item.quantity,
        comment: item.comment,
        color: item.color,
        position: index,
      }),
    ),
    createdAt: now,
    updatedAt: now,
  })

  const { error } = await supabase.from('templates').insert(templateToRow(template, userId))
  if (error) throw error
  bumpData()
  return template
}

export async function getTemplates(): Promise<TemplateRecord[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as TemplateRow[]).map(mapTemplateRow)
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) throw error
  bumpData()
}

export async function getLinkedListIds(listId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('list_links')
    .select('*')
    .or(`list_id_a.eq.${listId},list_id_b.eq.${listId}`)

  if (error) throw error
  return (data ?? []).map((row) => {
    const link = mapLinkRow(row)
    return link.listIdA === listId ? link.listIdB : link.listIdA
  })
}

export async function getLinkedLists(listId: string): Promise<ListRecord[]> {
  const ids = await getLinkedListIds(listId)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .in('id', ids)
    .is('deleted_at', null)

  if (error) throw error
  return (data as ListRow[])
    .map(mapListRow)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function linkLists(a: string, b: string): Promise<boolean> {
  const pair = normalizeLinkPair(a, b)
  if (!pair) return false

  const userId = await requireUserId()
  const { data: existing, error: findError } = await supabase
    .from('list_links')
    .select('id')
    .eq('list_id_a', pair.listIdA)
    .eq('list_id_b', pair.listIdB)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return true

  const { error } = await supabase.from('list_links').insert({
    id: createId(),
    user_id: userId,
    list_id_a: pair.listIdA,
    list_id_b: pair.listIdB,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
  bumpData()
  return true
}

export async function unlinkLists(a: string, b: string): Promise<void> {
  const pair = normalizeLinkPair(a, b)
  if (!pair) return

  const { error } = await supabase
    .from('list_links')
    .delete()
    .eq('list_id_a', pair.listIdA)
    .eq('list_id_b', pair.listIdB)
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

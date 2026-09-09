import { db, enqueueSync, flushSyncQueue } from './index'
import type { ListItem, ListRecord, TemplateItem, TemplateRecord } from './types'
import { createId } from '../utils/id'
import { normalizeLinkPair } from '../utils/links'

async function touchSync(
  entity: 'list' | 'template' | 'link',
  action: 'upsert' | 'delete',
  payload: unknown,
): Promise<void> {
  await enqueueSync(entity, action, payload)
  void flushSyncQueue()
}

export async function getActiveLists(): Promise<ListRecord[]> {
  const lists = await db.lists.filter((l) => l.deletedAt === null).toArray()
  return lists.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getTrashLists(): Promise<ListRecord[]> {
  const lists = await db.lists.filter((l) => l.deletedAt !== null).toArray()
  return lists.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
}

export async function getList(id: string): Promise<ListRecord | undefined> {
  return db.lists.get(id)
}

export async function createList(input: {
  name: string
  deadline: string | null
  items: ListItem[]
}): Promise<ListRecord> {
  const now = Date.now()
  const list: ListRecord = {
    id: createId(),
    name: input.name.trim() || 'Untitled',
    deadline: input.deadline,
    items: input.items,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  await db.lists.add(list)
  await touchSync('list', 'upsert', list)
  return list
}

export async function createListFromTemplate(
  templateId: string,
  name?: string,
): Promise<ListRecord | null> {
  const template = await db.templates.get(templateId)
  if (!template) return null
  return createList({
    name: name?.trim() || template.name,
    deadline: null,
    items: template.items.map((item) => ({
      id: createId(),
      name: item.name,
      quantity: item.quantity,
      comment: item.comment,
      color: item.color ?? null,
      checked: false,
    })),
  })
}

export async function updateList(
  id: string,
  patch: Partial<Pick<ListRecord, 'name' | 'deadline' | 'items'>>,
): Promise<ListRecord | null> {
  const existing = await db.lists.get(id)
  if (!existing || existing.deletedAt !== null) return null
  const updated: ListRecord = {
    ...existing,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() || existing.name : existing.name,
    updatedAt: Date.now(),
  }
  await db.lists.put(updated)
  await touchSync('list', 'upsert', updated)
  return updated
}

export async function softDeleteList(id: string): Promise<void> {
  const existing = await db.lists.get(id)
  if (!existing) return
  const updated: ListRecord = {
    ...existing,
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  }
  await db.lists.put(updated)
  await touchSync('list', 'upsert', updated)
}

export async function restoreList(id: string): Promise<void> {
  const existing = await db.lists.get(id)
  if (!existing) return
  const updated: ListRecord = {
    ...existing,
    deletedAt: null,
    updatedAt: Date.now(),
  }
  await db.lists.put(updated)
  await touchSync('list', 'upsert', updated)
}

export async function purgeList(id: string): Promise<void> {
  await db.transaction('rw', db.lists, db.links, db.syncQueue, async () => {
    await db.lists.delete(id)
    await db.links.where('listIdA').equals(id).delete()
    await db.links.where('listIdB').equals(id).delete()
    await enqueueSync('list', 'delete', { id })
  })
  void flushSyncQueue()
}

export async function saveListAsTemplate(listId: string): Promise<TemplateRecord | null> {
  const list = await db.lists.get(listId)
  if (!list || list.deletedAt !== null) return null
  const now = Date.now()
  const template: TemplateRecord = {
    id: createId(),
    name: list.name,
    items: list.items.map(
      (item): TemplateItem => ({
        id: createId(),
        name: item.name,
        quantity: item.quantity,
        comment: item.comment,
        color: item.color ?? null,
      }),
    ),
    createdAt: now,
    updatedAt: now,
  }
  await db.templates.add(template)
  await touchSync('template', 'upsert', template)
  return template
}

export async function getTemplates(): Promise<TemplateRecord[]> {
  const templates = await db.templates.toArray()
  return templates.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id)
  await touchSync('template', 'delete', { id })
}

export async function getLinkedListIds(listId: string): Promise<string[]> {
  const asA = await db.links.where('listIdA').equals(listId).toArray()
  const asB = await db.links.where('listIdB').equals(listId).toArray()
  return [...asA, ...asB].map((link) =>
    link.listIdA === listId ? link.listIdB : link.listIdA,
  )
}

export async function getLinkedLists(listId: string): Promise<ListRecord[]> {
  const ids = await getLinkedListIds(listId)
  if (ids.length === 0) return []
  const lists = await db.lists.bulkGet(ids)
  return lists
    .filter((l): l is ListRecord => !!l && l.deletedAt === null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function linkLists(a: string, b: string): Promise<boolean> {
  const pair = normalizeLinkPair(a, b)
  if (!pair) return false
  const existing = await db.links
    .filter((l) => l.listIdA === pair.listIdA && l.listIdB === pair.listIdB)
    .first()
  if (existing) return true
  const link = {
    id: createId(),
    ...pair,
    createdAt: Date.now(),
  }
  await db.links.add(link)
  await touchSync('link', 'upsert', link)
  return true
}

export async function unlinkLists(a: string, b: string): Promise<void> {
  const pair = normalizeLinkPair(a, b)
  if (!pair) return
  const existing = await db.links
    .filter((l) => l.listIdA === pair.listIdA && l.listIdB === pair.listIdB)
    .first()
  if (!existing) return
  await db.links.delete(existing.id)
  await touchSync('link', 'delete', { id: existing.id })
}

export function emptyItem(): ListItem {
  return {
    id: createId(),
    name: '',
    quantity: 1,
    comment: '',
    checked: false,
    color: null,
  }
}

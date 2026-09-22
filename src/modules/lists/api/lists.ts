import { bumpData } from '../../../shared/store/dataStore'
import type { ListItem, ListRecord } from '../types/models'
import { createId } from '../../../shared/utils/id'
import { normalizeListRecord, reindexPositions, sortByPosition } from '../utils/positions'
import { requireUserId } from '../../../shared/api/auth'
import { mergeRemoteList, peekList, putList, removeList } from './listCache'
import { listToRow, mapListRow, type ListRow } from './mappers'
import { supabase } from '../../../shared/lib/supabase'

/** Serialize persists per list so rapid toggles/DnD don't clobber each other. */
const persistChain = new Map<string, Promise<void>>()

function enqueuePersist(id: string, task: () => Promise<void>): Promise<void> {
  const previous = persistChain.get(id) ?? Promise.resolve()
  const next = previous.then(task, task).finally(() => {
    if (persistChain.get(id) === next) persistChain.delete(id)
  })
  persistChain.set(id, next)
  return next
}

async function fetchListFromNetwork(id: string): Promise<ListRecord | null> {
  const { data, error } = await supabase.from('lists').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return mergeRemoteList(mapListRow(data as ListRow))
}

export async function getActiveLists(): Promise<ListRecord[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .is('deleted_at', null)
    .order('position', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw error
  return sortByPosition((data as ListRow[]).map(mapListRow).map(mergeRemoteList))
}

export async function getTrashLists(): Promise<ListRecord[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) throw error
  return (data as ListRow[]).map(mapListRow).map(mergeRemoteList)
}

export async function getList(id: string): Promise<ListRecord | null> {
  const cached = peekList(id)
  if (cached) return cached

  try {
    return await fetchListFromNetwork(id)
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

  const { data: activeRows, error: activeError } = await supabase
    .from('lists')
    .select('*')
    .is('deleted_at', null)
  if (activeError) throw activeError

  const existing = sortByPosition(
    ((activeRows as ListRow[]) ?? []).map(mapListRow).map(mergeRemoteList),
  )

  const created = normalizeListRecord({
    id: createId(),
    name: input.name.trim() || 'Untitled',
    deadline: input.deadline,
    trackQuantity: input.trackQuantity,
    position: 0,
    items: reindexPositions(input.items),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })

  const ordered = reindexPositions([
    created,
    ...existing.map((list) => normalizeListRecord({ ...list, updatedAt: now })),
  ])
  for (const row of ordered) putList(row)
  bumpData()

  const { error } = await supabase.from('lists').insert(listToRow(ordered[0], userId))
  if (error) throw error

  await Promise.all(
    ordered.slice(1).map((row) =>
      enqueuePersist(row.id, async () => {
        const latest = peekList(row.id) ?? row
        const { error: updateError } = await supabase
          .from('lists')
          .update({
            position: latest.position,
            updated_at: new Date(latest.updatedAt).toISOString(),
          })
          .eq('id', row.id)
        if (updateError) throw updateError
      }),
    ),
  )

  return peekList(ordered[0].id) ?? ordered[0]
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

/**
 * Optimistic update: patch the in-memory list + notify UI immediately,
 * then persist to Supabase (queued; always writes the latest cached snapshot).
 */
export async function updateList(
  id: string,
  patch: Partial<Pick<ListRecord, 'name' | 'deadline' | 'items' | 'trackQuantity' | 'position'>>,
): Promise<ListRecord | null> {
  let existing = peekList(id)
  if (!existing) {
    existing = (await fetchListFromNetwork(id)) ?? undefined
  }
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
    position: patch.position !== undefined ? patch.position : existing.position,
    items,
    updatedAt: Date.now(),
  })

  putList(updated)
  bumpData()

  await enqueuePersist(id, async () => {
    const latest = peekList(id) ?? updated
    const userId = await requireUserId()
    const { error } = await supabase.from('lists').update(listToRow(latest, userId)).eq('id', id)
    if (error) throw error
  }).catch((error) => {
    console.error('updateList persist failed', id, error)
    throw error
  })

  return peekList(id) ?? updated
}

/** Optimistic reorder of active lists (0 = top). */
export async function reorderLists(ordered: ListRecord[]): Promise<void> {
  const now = Date.now()
  const next = reindexPositions(
    ordered.map((list) => normalizeListRecord({ ...list, updatedAt: now, deletedAt: null })),
  )
  for (const list of next) putList(list)
  bumpData()

  await Promise.all(
    next.map((list) =>
      enqueuePersist(list.id, async () => {
        const latest = peekList(list.id) ?? list
        const { error } = await supabase
          .from('lists')
          .update({
            position: latest.position,
            updated_at: new Date(latest.updatedAt).toISOString(),
          })
          .eq('id', list.id)
        if (error) throw error
      }),
    ),
  ).catch((error) => {
    console.error('reorderLists persist failed', error)
  })
}

export async function softDeleteList(id: string): Promise<void> {
  const existing = peekList(id) ?? (await fetchListFromNetwork(id))
  if (!existing) return
  const now = Date.now()
  const updated = normalizeListRecord({ ...existing, deletedAt: now, updatedAt: now })
  putList(updated)
  bumpData()

  await enqueuePersist(id, async () => {
    const { error } = await supabase
      .from('lists')
      .update({
        deleted_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      })
      .eq('id', id)
    if (error) throw error
  })
}

export async function restoreList(id: string): Promise<void> {
  const existing = peekList(id) ?? (await fetchListFromNetwork(id))
  if (!existing) return
  const now = Date.now()

  const { data: activeRows } = await supabase.from('lists').select('position').is('deleted_at', null)
  const maxPos = ((activeRows as { position: number | null }[]) ?? []).reduce((max, row) => {
    const p = typeof row.position === 'number' ? row.position : -1
    return Math.max(max, p)
  }, -1)

  const updated = normalizeListRecord({
    ...existing,
    deletedAt: null,
    updatedAt: now,
    position: maxPos + 1,
  })
  putList(updated)
  bumpData()

  await enqueuePersist(id, async () => {
    const latest = peekList(id) ?? updated
    const { error } = await supabase
      .from('lists')
      .update({
        deleted_at: null,
        updated_at: new Date(latest.updatedAt).toISOString(),
        position: latest.position,
      })
      .eq('id', id)
    if (error) throw error
  })
}

export async function purgeList(id: string): Promise<void> {
  removeList(id)
  bumpData()
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
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

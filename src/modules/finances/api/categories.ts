import { bumpData } from '../../../shared/store/dataStore'
import type { Category } from '../types/models'
import { createId } from '../../../shared/utils/id'
import { requireUserId } from '../../../shared/api/auth'
import {
  hydrateEntityCache,
  listCategoriesCached,
  mergeRemoteCategory,
  peekCategory,
  putCategory,
} from './entityCache'
import { mapCategoryRow, type CategoryRow } from './mappers'
import { supabase } from '../../../shared/lib/supabase'
import { enqueueSync, flushSyncQueue } from './syncQueue'

const DEFAULT_ICON = '💳'

export async function getCategories(): Promise<Category[]> {
  hydrateEntityCache()
  const cached = listCategoriesCached()

  if (!navigator.onLine) return cached

  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    for (const row of (data as CategoryRow[]) ?? []) {
      mergeRemoteCategory(mapCategoryRow(row))
    }
    void flushSyncQueue()
    return listCategoriesCached()
  } catch (error) {
    console.error('getCategories failed', error)
    return cached
  }
}

export async function createCategory(input: { name: string; icon?: string }): Promise<Category> {
  await requireUserId()
  hydrateEntityCache()
  const now = Date.now()
  const category: Category = {
    id: createId(),
    name: input.name.trim() || 'Untitled',
    icon: (input.icon ?? DEFAULT_ICON).trim() || DEFAULT_ICON,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  putCategory(category)
  bumpData()
  enqueueSync({ kind: 'upsert_category', category })
  return category
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'icon'>>,
): Promise<Category | null> {
  hydrateEntityCache()
  const existing = peekCategory(id)
  if (!existing || existing.deletedAt !== null) return null

  const next: Category = {
    ...existing,
    name: patch.name !== undefined ? patch.name.trim() || existing.name : existing.name,
    icon: patch.icon !== undefined ? patch.icon.trim() || existing.icon : existing.icon,
    updatedAt: Date.now(),
  }
  putCategory(next)
  bumpData()
  enqueueSync({ kind: 'upsert_category', category: next })
  return next
}

export async function deleteCategory(id: string): Promise<void> {
  hydrateEntityCache()
  const existing = peekCategory(id)
  if (!existing) return

  const soft: Category = {
    ...existing,
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  }
  putCategory(soft)
  bumpData()
  enqueueSync({ kind: 'upsert_category', category: soft })
}

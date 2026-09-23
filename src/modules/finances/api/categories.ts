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
import { DEFAULT_CATEGORY_ICON, DEFAULT_CATEGORY_SEEDS } from '../utils/categoryIcons'
import i18n from '../../../i18n'

let seedInFlight: Promise<void> | null = null

async function ensureDefaultCategories(): Promise<void> {
  if (seedInFlight) {
    await seedInFlight
    return
  }

  seedInFlight = (async () => {
    const { count, error } = await supabase
      .from('expense_categories')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    if ((count ?? 0) > 0) return

    const now = Date.now()
    for (const seed of DEFAULT_CATEGORY_SEEDS) {
      const category: Category = {
        id: createId(),
        name: i18n.t(seed.nameKey),
        icon: seed.icon,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      putCategory(category)
      enqueueSync({ kind: 'upsert_category', category })
    }
    bumpData()
    await flushSyncQueue()
  })().finally(() => {
    seedInFlight = null
  })

  await seedInFlight
}

export async function getCategories(): Promise<Category[]> {
  hydrateEntityCache()
  const cached = listCategoriesCached()

  if (!navigator.onLine) return cached

  try {
    await requireUserId()
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    for (const row of (data as CategoryRow[]) ?? []) {
      mergeRemoteCategory(mapCategoryRow(row))
    }

    if (((data as CategoryRow[]) ?? []).length === 0) {
      await ensureDefaultCategories()
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
    icon: (input.icon ?? DEFAULT_CATEGORY_ICON).trim() || DEFAULT_CATEGORY_ICON,
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

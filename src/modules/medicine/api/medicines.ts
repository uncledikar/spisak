import { bumpData } from '../../../shared/store/dataStore'
import type { Medicine } from '../types/models'
import { createId } from '../../../shared/utils/id'
import { requireUserId } from '../../../shared/api/auth'
import {
  hydrateEntityCache,
  listMedicinesCached,
  mergeRemoteMedicine,
  peekMedicine,
  putMedicine,
} from './entityCache'
import { mapMedicineRow, type MedicineRow } from './mappers'
import { supabase } from '../../../shared/lib/supabase'
import { enqueueSync, flushSyncQueue } from './syncQueue'

export async function getMedicines(): Promise<Medicine[]> {
  hydrateEntityCache()
  const cached = listMedicinesCached()

  if (!navigator.onLine) return cached

  try {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    for (const row of (data as MedicineRow[]) ?? []) {
      mergeRemoteMedicine(mapMedicineRow(row))
    }
    void flushSyncQueue()
    return listMedicinesCached()
  } catch (error) {
    console.error('getMedicines failed', error)
    return cached
  }
}

export async function createMedicine(input: { name: string; unit?: string }): Promise<Medicine> {
  await requireUserId()
  hydrateEntityCache()
  const now = Date.now()
  const medicine: Medicine = {
    id: createId(),
    name: input.name.trim() || 'Untitled',
    unit: (input.unit ?? 'pcs').trim() || 'pcs',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  putMedicine(medicine)
  bumpData()
  enqueueSync({ kind: 'upsert_medicine', medicine })
  return medicine
}

export async function updateMedicine(
  id: string,
  patch: Partial<Pick<Medicine, 'name' | 'unit'>>,
): Promise<Medicine | null> {
  hydrateEntityCache()
  const existing = peekMedicine(id)
  if (!existing || existing.deletedAt !== null) return null

  const next: Medicine = {
    ...existing,
    name: patch.name !== undefined ? patch.name.trim() || existing.name : existing.name,
    unit: patch.unit !== undefined ? patch.unit.trim() || existing.unit : existing.unit,
    updatedAt: Date.now(),
  }
  putMedicine(next)
  bumpData()
  enqueueSync({ kind: 'upsert_medicine', medicine: next })
  return next
}

export async function deleteMedicine(id: string): Promise<void> {
  hydrateEntityCache()
  const existing = peekMedicine(id)
  if (!existing) return

  const soft: Medicine = {
    ...existing,
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  }
  putMedicine(soft)
  bumpData()
  enqueueSync({ kind: 'upsert_medicine', medicine: soft })
}

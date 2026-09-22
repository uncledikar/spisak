import { bumpData } from '../../../shared/store/dataStore'
import type { Consumption } from '../types/models'
import { createId } from '../../../shared/utils/id'
import { todayKey } from '../utils/periods'
import { requireUserId } from '../../../shared/api/auth'
import {
  hydrateEntityCache,
  listConsumptionsCached,
  mergeRemoteConsumption,
  peekConsumption,
  putConsumption,
  removeConsumptionLocal,
} from './entityCache'
import { mapConsumptionRow, type ConsumptionRow } from './mappers'
import { supabase } from '../../../shared/lib/supabase'
import { enqueueSync, flushSyncQueue } from './syncQueue'

export async function getConsumptions(): Promise<Consumption[]> {
  hydrateEntityCache()
  const cached = listConsumptionsCached()

  if (!navigator.onLine) return cached

  try {
    const { data, error } = await supabase
      .from('consumptions')
      .select('*')
      .order('consumed_on', { ascending: false })

    if (error) throw error
    for (const row of (data as ConsumptionRow[]) ?? []) {
      mergeRemoteConsumption(mapConsumptionRow(row))
    }
    void flushSyncQueue()
    return listConsumptionsCached()
  } catch (error) {
    console.error('getConsumptions failed', error)
    return cached
  }
}

export async function logConsumption(input: {
  medicineId: string
  quantity: number
  consumedOn?: string
}): Promise<Consumption> {
  await requireUserId()
  hydrateEntityCache()
  const now = Date.now()
  const row: Consumption = {
    id: createId(),
    medicineId: input.medicineId,
    quantity: Math.max(0.01, Number(input.quantity) || 1),
    consumedOn: input.consumedOn ?? todayKey(),
    createdAt: now,
    updatedAt: now,
  }
  putConsumption(row)
  bumpData()
  enqueueSync({ kind: 'upsert_consumption', consumption: row })
  return row
}

export async function updateConsumption(
  id: string,
  patch: Partial<Pick<Consumption, 'quantity' | 'consumedOn' | 'medicineId'>>,
): Promise<Consumption | null> {
  hydrateEntityCache()
  const existing = peekConsumption(id)
  if (!existing) return null

  const next: Consumption = {
    ...existing,
    medicineId: patch.medicineId ?? existing.medicineId,
    quantity:
      patch.quantity !== undefined ? Math.max(0.01, Number(patch.quantity) || existing.quantity) : existing.quantity,
    consumedOn: patch.consumedOn ?? existing.consumedOn,
    updatedAt: Date.now(),
  }
  putConsumption(next)
  bumpData()
  enqueueSync({ kind: 'upsert_consumption', consumption: next })
  return next
}

export async function deleteConsumption(id: string): Promise<void> {
  hydrateEntityCache()
  removeConsumptionLocal(id)
  bumpData()
  enqueueSync({ kind: 'delete_consumption', id })
}

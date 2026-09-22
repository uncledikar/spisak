import { supabase } from '../../../shared/lib/supabase'
import { requireUserId } from '../../../shared/api/auth'
import { consumptionToRow, medicineToRow } from './mappers'
import type { Consumption, Medicine } from '../types/models'

export type SyncOp =
  | { kind: 'upsert_medicine'; medicine: Medicine }
  | { kind: 'delete_medicine'; id: string }
  | { kind: 'upsert_consumption'; consumption: Consumption }
  | { kind: 'delete_consumption'; id: string }

const QUEUE_KEY = 'medicine.syncQueue'
const chain = new Map<string, Promise<void>>()

function readQueue(): SyncOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SyncOp[]
  } catch {
    return []
  }
}

function writeQueue(ops: SyncOp[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops))
}

export function enqueueSync(op: SyncOp): void {
  const queue = readQueue()
  // Collapse ops for the same entity id.
  const id =
    op.kind === 'upsert_medicine' || op.kind === 'delete_medicine'
      ? op.kind === 'upsert_medicine'
        ? op.medicine.id
        : op.id
      : op.kind === 'upsert_consumption'
        ? op.consumption.id
        : op.id

  const filtered = queue.filter((item) => {
    const itemId =
      item.kind === 'upsert_medicine'
        ? item.medicine.id
        : item.kind === 'delete_medicine'
          ? item.id
          : item.kind === 'upsert_consumption'
            ? item.consumption.id
            : item.id
    return itemId !== id
  })
  filtered.push(op)
  writeQueue(filtered)
  void flushSyncQueue()
}

function enqueuePersist(key: string, task: () => Promise<void>): Promise<void> {
  const previous = chain.get(key) ?? Promise.resolve()
  const next = previous.then(task, task).finally(() => {
    if (chain.get(key) === next) chain.delete(key)
  })
  chain.set(key, next)
  return next
}

async function applyOp(op: SyncOp): Promise<void> {
  const userId = await requireUserId()
  switch (op.kind) {
    case 'upsert_medicine': {
      const { error } = await supabase
        .from('medicines')
        .upsert(medicineToRow(op.medicine, userId), { onConflict: 'id' })
      if (error) throw error
      return
    }
    case 'delete_medicine': {
      const { error } = await supabase.from('medicines').delete().eq('id', op.id)
      if (error) throw error
      return
    }
    case 'upsert_consumption': {
      const { error } = await supabase
        .from('consumptions')
        .upsert(consumptionToRow(op.consumption, userId), { onConflict: 'id' })
      if (error) throw error
      return
    }
    case 'delete_consumption': {
      const { error } = await supabase.from('consumptions').delete().eq('id', op.id)
      if (error) throw error
      return
    }
  }
}

export async function flushSyncQueue(): Promise<void> {
  if (!navigator.onLine) return
  await enqueuePersist('queue', async () => {
    let queue = readQueue()
    while (queue.length > 0) {
      if (!navigator.onLine) return
      const [op, ...rest] = queue
      try {
        await applyOp(op)
        queue = rest
        writeQueue(queue)
      } catch (error) {
        console.error('sync op failed', op, error)
        return
      }
    }
  })
}

export function clearSyncQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}

export function startSyncListeners(): void {
  window.addEventListener('online', () => {
    void flushSyncQueue()
  })
}

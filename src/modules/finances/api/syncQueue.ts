import { supabase } from '../../../shared/lib/supabase'
import { requireUserId } from '../../../shared/api/auth'
import { categoryToRow, expenseToRow } from './mappers'
import type { Category, Expense } from '../types/models'

export type SyncOp =
  | { kind: 'upsert_category'; category: Category }
  | { kind: 'delete_category'; id: string }
  | { kind: 'upsert_expense'; expense: Expense }
  | { kind: 'delete_expense'; id: string }

const QUEUE_KEY = 'finances.syncQueue'
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
  const id =
    op.kind === 'upsert_category' || op.kind === 'delete_category'
      ? op.kind === 'upsert_category'
        ? op.category.id
        : op.id
      : op.kind === 'upsert_expense'
        ? op.expense.id
        : op.id

  const filtered = queue.filter((item) => {
    const itemId =
      item.kind === 'upsert_category'
        ? item.category.id
        : item.kind === 'delete_category'
          ? item.id
          : item.kind === 'upsert_expense'
            ? item.expense.id
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
    case 'upsert_category': {
      const { error } = await supabase
        .from('expense_categories')
        .upsert(categoryToRow(op.category, userId), { onConflict: 'id' })
      if (error) throw error
      return
    }
    case 'delete_category': {
      const { error } = await supabase.from('expense_categories').delete().eq('id', op.id)
      if (error) throw error
      return
    }
    case 'upsert_expense': {
      const { error } = await supabase
        .from('expenses')
        .upsert(expenseToRow(op.expense, userId), { onConflict: 'id' })
      if (error) throw error
      return
    }
    case 'delete_expense': {
      const { error } = await supabase.from('expenses').delete().eq('id', op.id)
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

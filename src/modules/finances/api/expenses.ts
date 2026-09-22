import { bumpData } from '../../../shared/store/dataStore'
import type { Expense } from '../types/models'
import { createId } from '../../../shared/utils/id'
import { todayKey } from '../utils/periods'
import { requireUserId } from '../../../shared/api/auth'
import {
  hydrateEntityCache,
  listExpensesCached,
  mergeRemoteExpense,
  peekExpense,
  putExpense,
  removeExpenseLocal,
} from './entityCache'
import { mapExpenseRow, type ExpenseRow } from './mappers'
import { supabase } from '../../../shared/lib/supabase'
import { enqueueSync, flushSyncQueue } from './syncQueue'

export async function getExpenses(): Promise<Expense[]> {
  hydrateEntityCache()
  const cached = listExpensesCached()

  if (!navigator.onLine) return cached

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('spent_on', { ascending: false })

    if (error) throw error
    for (const row of (data as ExpenseRow[]) ?? []) {
      mergeRemoteExpense(mapExpenseRow(row))
    }
    void flushSyncQueue()
    return listExpensesCached()
  } catch (error) {
    console.error('getExpenses failed', error)
    return cached
  }
}

export async function logExpense(input: {
  categoryId: string
  amount: number
  spentOn?: string
  comment?: string | null
}): Promise<Expense> {
  await requireUserId()
  hydrateEntityCache()
  const now = Date.now()
  const comment = input.comment?.trim() || null
  const row: Expense = {
    id: createId(),
    categoryId: input.categoryId,
    amount: Math.max(0.01, Number(input.amount) || 0),
    spentOn: input.spentOn ?? todayKey(),
    comment,
    createdAt: now,
    updatedAt: now,
  }
  putExpense(row)
  bumpData()
  enqueueSync({ kind: 'upsert_expense', expense: row })
  return row
}

export async function updateExpense(
  id: string,
  patch: Partial<Pick<Expense, 'amount' | 'spentOn' | 'categoryId' | 'comment'>>,
): Promise<Expense | null> {
  hydrateEntityCache()
  const existing = peekExpense(id)
  if (!existing) return null

  const next: Expense = {
    ...existing,
    categoryId: patch.categoryId ?? existing.categoryId,
    amount:
      patch.amount !== undefined ? Math.max(0.01, Number(patch.amount) || existing.amount) : existing.amount,
    spentOn: patch.spentOn ?? existing.spentOn,
    comment:
      patch.comment !== undefined ? (patch.comment?.trim() || null) : existing.comment,
    updatedAt: Date.now(),
  }
  putExpense(next)
  bumpData()
  enqueueSync({ kind: 'upsert_expense', expense: next })
  return next
}

export async function deleteExpense(id: string): Promise<void> {
  hydrateEntityCache()
  removeExpenseLocal(id)
  bumpData()
  enqueueSync({ kind: 'delete_expense', id })
}

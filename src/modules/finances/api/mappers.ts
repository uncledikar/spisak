import type { Category, Expense } from '../types/models'
import { toEpochMs, toIso } from '../../../shared/api/auth'

export type CategoryRow = {
  id: string
  user_id: string
  name: string
  icon: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ExpenseRow = {
  id: string
  user_id: string
  category_id: string
  amount: number | string
  spent_on: string
  comment: string | null
  created_at: string
  updated_at: string
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '💳',
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
    updatedAt: toEpochMs(row.updated_at) ?? Date.now(),
    deletedAt: row.deleted_at ? (toEpochMs(row.deleted_at) ?? Date.now()) : null,
  }
}

export function categoryToRow(category: Category, userId: string): CategoryRow {
  return {
    id: category.id,
    user_id: userId,
    name: category.name,
    icon: category.icon,
    created_at: toIso(category.createdAt),
    updated_at: toIso(category.updatedAt),
    deleted_at: category.deletedAt ? toIso(category.deletedAt) : null,
  }
}

export function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: Number(row.amount),
    spentOn: row.spent_on,
    comment: row.comment,
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
    updatedAt: toEpochMs(row.updated_at) ?? Date.now(),
  }
}

export function expenseToRow(row: Expense, userId: string): ExpenseRow {
  return {
    id: row.id,
    user_id: userId,
    category_id: row.categoryId,
    amount: row.amount,
    spent_on: row.spentOn,
    comment: row.comment,
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  }
}

import type { Category, Expense } from '../types/models'

const categories = new Map<string, Category>()
const expenses = new Map<string, Expense>()

const CAT_KEY = 'finances.categories'
const EXP_KEY = 'finances.expenses'

function loadMap<T extends { id: string }>(key: string, target: Map<string, T>): void {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const rows = JSON.parse(raw) as T[]
    for (const row of rows) target.set(row.id, row)
  } catch {
    /* ignore */
  }
}

function persistCategories(): void {
  localStorage.setItem(CAT_KEY, JSON.stringify([...categories.values()]))
}

function persistExpenses(): void {
  localStorage.setItem(EXP_KEY, JSON.stringify([...expenses.values()]))
}

let hydrated = false

export function hydrateEntityCache(): void {
  if (hydrated) return
  hydrated = true
  loadMap(CAT_KEY, categories)
  loadMap(EXP_KEY, expenses)
}

export function peekCategory(id: string): Category | undefined {
  return categories.get(id)
}

export function putCategory(category: Category): void {
  categories.set(category.id, category)
  persistCategories()
}

export function mergeRemoteCategory(remote: Category): Category {
  const cached = categories.get(remote.id)
  if (cached && cached.updatedAt > remote.updatedAt) return cached
  categories.set(remote.id, remote)
  persistCategories()
  return remote
}

export function listCategoriesCached(): Category[] {
  return [...categories.values()]
    .filter((c) => c.deletedAt === null)
    .sort((a, b) => a.name.localeCompare(b.name) || b.updatedAt - a.updatedAt)
}

export function peekExpense(id: string): Expense | undefined {
  return expenses.get(id)
}

export function putExpense(row: Expense): void {
  expenses.set(row.id, row)
  persistExpenses()
}

export function mergeRemoteExpense(remote: Expense): Expense {
  const cached = expenses.get(remote.id)
  if (cached && cached.updatedAt > remote.updatedAt) return cached
  expenses.set(remote.id, remote)
  persistExpenses()
  return remote
}

export function removeExpenseLocal(id: string): void {
  expenses.delete(id)
  persistExpenses()
}

export function listExpensesCached(): Expense[] {
  return [...expenses.values()].sort((a, b) => {
    if (a.spentOn !== b.spentOn) return b.spentOn.localeCompare(a.spentOn)
    return b.updatedAt - a.updatedAt
  })
}

export function clearEntityCache(): void {
  categories.clear()
  expenses.clear()
  localStorage.removeItem(CAT_KEY)
  localStorage.removeItem(EXP_KEY)
}

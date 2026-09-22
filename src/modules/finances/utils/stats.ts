import type { DateRange, Category, Expense } from '../types/models'
import { inRange } from './periods'

export type CategoryBar = {
  categoryId: string
  name: string
  icon: string
  current: number
  previous: number
}

export function aggregateByCategory(
  expenses: Expense[],
  categories: Category[],
  current: DateRange,
  previous: DateRange | null,
): { bars: CategoryBar[]; totalCurrent: number; totalPrevious: number } {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const currentMap = new Map<string, number>()
  const previousMap = new Map<string, number>()
  let totalCurrent = 0
  let totalPrevious = 0

  for (const row of expenses) {
    if (inRange(row.spentOn, current)) {
      currentMap.set(row.categoryId, (currentMap.get(row.categoryId) ?? 0) + row.amount)
      totalCurrent += row.amount
    } else if (previous && inRange(row.spentOn, previous)) {
      previousMap.set(row.categoryId, (previousMap.get(row.categoryId) ?? 0) + row.amount)
      totalPrevious += row.amount
    }
  }

  const ids = new Set([...currentMap.keys(), ...previousMap.keys()])
  const bars: CategoryBar[] = [...ids]
    .map((categoryId) => {
      const cat = byId.get(categoryId)
      return {
        categoryId,
        name: cat?.name ?? '—',
        icon: cat?.icon ?? '💳',
        current: currentMap.get(categoryId) ?? 0,
        previous: previousMap.get(categoryId) ?? 0,
      }
    })
    .sort((a, b) => b.current - a.current || a.name.localeCompare(b.name))

  return { bars, totalCurrent, totalPrevious }
}

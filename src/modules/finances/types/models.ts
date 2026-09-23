export type Category = {
  id: string
  name: string
  icon: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export type Expense = {
  id: string
  categoryId: string
  amount: number
  /** YYYY-MM-DD */
  spentOn: string
  comment: string | null
  createdAt: number
  updatedAt: number
}

export type PeriodKind = 'day' | 'week' | 'month' | 'year' | 'custom' | 'date'

export type DateRange = {
  start: string
  end: string
}

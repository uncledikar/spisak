export type Medicine = {
  id: string
  name: string
  unit: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export type Consumption = {
  id: string
  medicineId: string
  quantity: number
  /** YYYY-MM-DD */
  consumedOn: string
  createdAt: number
  updatedAt: number
}

export type PeriodKind = 'day' | 'week' | 'month' | 'year' | 'custom'

export type DateRange = {
  start: string
  end: string
}

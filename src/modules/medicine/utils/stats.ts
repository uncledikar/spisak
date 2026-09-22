import type { Consumption, DateRange, Medicine } from '../types/models'
import { inRange } from './periods'

export type MedicineBar = {
  medicineId: string
  name: string
  unit: string
  current: number
  previous: number
}

export function aggregateByMedicine(
  consumptions: Consumption[],
  medicines: Medicine[],
  current: DateRange,
  previous: DateRange | null,
): { bars: MedicineBar[]; totalCurrent: number; totalPrevious: number } {
  const nameById = new Map(medicines.map((m) => [m.id, m]))
  const currentMap = new Map<string, number>()
  const previousMap = new Map<string, number>()
  let totalCurrent = 0
  let totalPrevious = 0

  for (const row of consumptions) {
    if (inRange(row.consumedOn, current)) {
      currentMap.set(row.medicineId, (currentMap.get(row.medicineId) ?? 0) + row.quantity)
      totalCurrent += row.quantity
    } else if (previous && inRange(row.consumedOn, previous)) {
      previousMap.set(row.medicineId, (previousMap.get(row.medicineId) ?? 0) + row.quantity)
      totalPrevious += row.quantity
    }
  }

  const ids = new Set([...currentMap.keys(), ...previousMap.keys()])
  const bars: MedicineBar[] = [...ids]
    .map((medicineId) => {
      const med = nameById.get(medicineId)
      return {
        medicineId,
        name: med?.name ?? '—',
        unit: med?.unit ?? '',
        current: currentMap.get(medicineId) ?? 0,
        previous: previousMap.get(medicineId) ?? 0,
      }
    })
    .sort((a, b) => b.current - a.current || a.name.localeCompare(b.name))

  return { bars, totalCurrent, totalPrevious }
}

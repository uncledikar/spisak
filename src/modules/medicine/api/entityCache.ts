import type { Consumption, Medicine } from '../types/models'

const medicines = new Map<string, Medicine>()
const consumptions = new Map<string, Consumption>()

const MED_KEY = 'medicine.medicines'
const CON_KEY = 'medicine.consumptions'

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

function persistMedicines(): void {
  localStorage.setItem(MED_KEY, JSON.stringify([...medicines.values()]))
}

function persistConsumptions(): void {
  localStorage.setItem(CON_KEY, JSON.stringify([...consumptions.values()]))
}

let hydrated = false

export function hydrateEntityCache(): void {
  if (hydrated) return
  hydrated = true
  loadMap(MED_KEY, medicines)
  loadMap(CON_KEY, consumptions)
}

export function peekMedicine(id: string): Medicine | undefined {
  return medicines.get(id)
}

export function putMedicine(medicine: Medicine): void {
  medicines.set(medicine.id, medicine)
  persistMedicines()
}

export function mergeRemoteMedicine(remote: Medicine): Medicine {
  const cached = medicines.get(remote.id)
  if (cached && cached.updatedAt > remote.updatedAt) return cached
  medicines.set(remote.id, remote)
  persistMedicines()
  return remote
}

export function removeMedicineLocal(id: string): void {
  medicines.delete(id)
  persistMedicines()
}

export function listMedicinesCached(): Medicine[] {
  return [...medicines.values()]
    .filter((m) => m.deletedAt === null)
    .sort((a, b) => a.name.localeCompare(b.name) || b.updatedAt - a.updatedAt)
}

export function peekConsumption(id: string): Consumption | undefined {
  return consumptions.get(id)
}

export function putConsumption(row: Consumption): void {
  consumptions.set(row.id, row)
  persistConsumptions()
}

export function mergeRemoteConsumption(remote: Consumption): Consumption {
  const cached = consumptions.get(remote.id)
  if (cached && cached.updatedAt > remote.updatedAt) return cached
  consumptions.set(remote.id, remote)
  persistConsumptions()
  return remote
}

export function removeConsumptionLocal(id: string): void {
  consumptions.delete(id)
  persistConsumptions()
}

export function listConsumptionsCached(): Consumption[] {
  return [...consumptions.values()].sort((a, b) => {
    if (a.consumedOn !== b.consumedOn) return b.consumedOn.localeCompare(a.consumedOn)
    return b.updatedAt - a.updatedAt
  })
}

export function clearEntityCache(): void {
  medicines.clear()
  consumptions.clear()
  localStorage.removeItem(MED_KEY)
  localStorage.removeItem(CON_KEY)
}

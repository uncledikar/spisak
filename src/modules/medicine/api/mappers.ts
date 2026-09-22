import type { Consumption, Medicine } from '../types/models'
import { toEpochMs, toIso } from '../../../shared/api/auth'

export type MedicineRow = {
  id: string
  user_id: string
  name: string
  unit: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ConsumptionRow = {
  id: string
  user_id: string
  medicine_id: string
  quantity: number | string
  consumed_on: string
  created_at: string
  updated_at: string
}

export function mapMedicineRow(row: MedicineRow): Medicine {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit || 'pcs',
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
    updatedAt: toEpochMs(row.updated_at) ?? Date.now(),
    deletedAt: row.deleted_at ? (toEpochMs(row.deleted_at) ?? Date.now()) : null,
  }
}

export function medicineToRow(medicine: Medicine, userId: string): MedicineRow {
  return {
    id: medicine.id,
    user_id: userId,
    name: medicine.name,
    unit: medicine.unit,
    created_at: toIso(medicine.createdAt),
    updated_at: toIso(medicine.updatedAt),
    deleted_at: medicine.deletedAt ? toIso(medicine.deletedAt) : null,
  }
}

export function mapConsumptionRow(row: ConsumptionRow): Consumption {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    quantity: Number(row.quantity),
    consumedOn: row.consumed_on,
    createdAt: toEpochMs(row.created_at) ?? Date.now(),
    updatedAt: toEpochMs(row.updated_at) ?? Date.now(),
  }
}

export function consumptionToRow(row: Consumption, userId: string): ConsumptionRow {
  return {
    id: row.id,
    user_id: userId,
    medicine_id: row.medicineId,
    quantity: row.quantity,
    consumed_on: row.consumedOn,
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  }
}

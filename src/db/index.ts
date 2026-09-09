import Dexie, { type EntityTable } from 'dexie'
import type {
  ListLink,
  ListRecord,
  SettingsRecord,
  SyncOp,
  TemplateRecord,
} from './types'

export class SpisokDB extends Dexie {
  lists!: EntityTable<ListRecord, 'id'>
  templates!: EntityTable<TemplateRecord, 'id'>
  links!: EntityTable<ListLink, 'id'>
  syncQueue!: EntityTable<SyncOp, 'id'>
  settings!: EntityTable<SettingsRecord, 'id'>

  constructor() {
    super('spisok')
    this.version(1).stores({
      lists: 'id, updatedAt, deletedAt, name',
      templates: 'id, updatedAt, name',
      links: 'id, listIdA, listIdB',
      syncQueue: 'id, createdAt, entity',
      settings: 'id',
    })
  }
}

export const db = new SpisokDB()

export async function enqueueSync(
  entity: SyncOp['entity'],
  action: SyncOp['action'],
  payload: unknown,
): Promise<void> {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entity,
    action,
    payload,
    createdAt: Date.now(),
  })
}

/** Stage 1 stub: flush when online. No server yet — queue kept for stage 2. */
export async function flushSyncQueue(): Promise<void> {
  if (!navigator.onLine) return
  // Stage 2: POST pending ops to API, then clear synced rows.
}

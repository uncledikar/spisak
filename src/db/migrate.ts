import { db } from './index'
import {
  listNeedsPersist,
  normalizeListRecord,
  normalizeTemplateRecord,
} from '../utils/positions'

/** One-shot migration for records saved before position/color/trackQuantity. */
export async function migrateLocalData(): Promise<void> {
  const lists = await db.lists.toArray()
  for (const list of lists) {
    const normalized = normalizeListRecord(list)
    if (listNeedsPersist(list, normalized)) {
      await db.lists.put({ ...normalized, updatedAt: list.updatedAt })
    }
  }

  const templates = await db.templates.toArray()
  for (const template of templates) {
    const normalized = normalizeTemplateRecord(template)
    const dirty =
      template.trackQuantity !== normalized.trackQuantity ||
      !Array.isArray(template.items) ||
      template.items.length !== normalized.items.length ||
      normalized.items.some((item, i) => template.items[i]?.position !== item.position)
    if (dirty) {
      await db.templates.put({ ...normalized, updatedAt: template.updatedAt })
    }
  }
}

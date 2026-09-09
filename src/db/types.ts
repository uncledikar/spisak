export interface ListItem {
  id: string
  name: string
  quantity: number
  comment: string
  checked: boolean
  /** Optional pastel swatch id, null = default surface */
  color: string | null
}

export interface ListRecord {
  id: string
  name: string
  deadline: string | null
  items: ListItem[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface TemplateItem {
  id: string
  name: string
  quantity: number
  comment: string
  color: string | null
}

export interface TemplateRecord {
  id: string
  name: string
  items: TemplateItem[]
  createdAt: number
  updatedAt: number
}

/** Undirected M:N link. listIdA < listIdB lexicographically. */
export interface ListLink {
  id: string
  listIdA: string
  listIdB: string
  createdAt: number
}

export interface SyncOp {
  id: string
  entity: 'list' | 'template' | 'link' | 'settings'
  action: 'upsert' | 'delete'
  payload: unknown
  createdAt: number
}

export interface SettingsRecord {
  id: 'app'
  theme: 'light' | 'dark'
  /** null = follow system once, then persist chosen/detected code */
  language: string | null
}

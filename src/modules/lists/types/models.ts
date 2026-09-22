export interface ListItem {
  id: string
  name: string
  quantity: number
  comment: string
  checked: boolean
  /** Optional pastel swatch id, null = default surface */
  color: string | null
  /** Order within the list (0-based). */
  position: number
}

export interface ListRecord {
  id: string
  name: string
  deadline: string | null
  /** When false, quantity fields are hidden in UI. */
  trackQuantity: boolean
  items: ListItem[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

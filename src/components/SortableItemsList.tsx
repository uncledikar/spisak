import type { Ref } from 'react'
import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import type { ListItem } from '../db/types'
import { itemColorValue } from '../utils/itemColors'
import { reindexPositions } from '../utils/positions'
import { QtyInput } from './QtyInput'

interface Props {
  items: ListItem[]
  trackQuantity: boolean
  onReorder: (items: ListItem[]) => void | Promise<void>
  onToggle: (itemId: string) => void | Promise<void>
  onQuantityChange: (itemId: string, quantity: number) => void | Promise<void>
  listRef?: Ref<HTMLDivElement>
}

function SortableRow({
  item,
  trackQuantity,
  onToggle,
  onQuantityChange,
}: {
  item: ListItem
  trackQuantity: boolean
  onToggle: (itemId: string) => void | Promise<void>
  onQuantityChange: (itemId: string, quantity: number) => void | Promise<void>
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const tint = itemColorValue(item.color)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: tint,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`item-row${trackQuantity ? '' : ' no-qty'}${item.checked ? ' checked' : ''}${isDragging ? ' dragging' : ''}${tint ? ' has-color' : ''}`}
    >
      <button
        type="button"
        className="drag-handle"
        aria-label={t('list.dragItem')}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <button
        type="button"
        className={`check${item.checked ? ' on' : ''}`}
        onClick={() => void onToggle(item.id)}
        aria-pressed={item.checked}
      >
        {item.checked ? '✓' : ''}
      </button>
      <div>
        <p className="item-name">{item.name}</p>
        {item.comment ? <p className="meta">{item.comment}</p> : null}
      </div>
      {trackQuantity ? (
        <QtyInput
          className="qty-input qty-input-view"
          value={item.quantity}
          onChange={(quantity) => void onQuantityChange(item.id, quantity)}
          aria-label={t('list.quantity')}
        />
      ) : null}
    </div>
  )
}

export function SortableItemsList({
  items,
  trackQuantity,
  onReorder,
  onToggle,
  onQuantityChange,
  listRef,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const ids = useMemo(() => items.map((item) => item.id), [items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = reindexPositions(arrayMove(items, oldIndex, newIndex))
    await onReorder(next)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={(e) => void handleDragEnd(e)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={listRef}
          className={`stack stack-items${activeId ? ' sorting' : ''}`}
        >
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              trackQuantity={trackQuantity}
              onToggle={onToggle}
              onQuantityChange={onQuantityChange}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

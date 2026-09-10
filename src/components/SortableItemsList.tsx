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
import { itemTintClass } from '../utils/itemColors'
import { reindexPositions } from '../utils/positions'

interface Props {
  items: ListItem[]
  trackQuantity: boolean
  onReorder: (items: ListItem[]) => void | Promise<void>
  onToggle: (itemId: string) => void | Promise<void>
  onOpenItem: (itemId: string) => void
  listRef?: Ref<HTMLDivElement>
}

function SortableRow({
  item,
  trackQuantity,
  onToggle,
  onOpenItem,
}: {
  item: ListItem
  trackQuantity: boolean
  onToggle: (itemId: string) => void | Promise<void>
  onOpenItem: (itemId: string) => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const tintClass = itemTintClass(item.color)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`item-row${trackQuantity ? '' : ' no-qty'}${item.checked ? ' checked' : ''}${isDragging ? ' dragging' : ''}`}
    >
      <button
        type="button"
        className={`drag-handle${tintClass ? ` ${tintClass}` : ''}`}
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
      <button
        type="button"
        className="item-row-main"
        onClick={() => onOpenItem(item.id)}
        aria-label={t('list.editItem')}
      >
        <p className="item-name">{item.name || t('list.untitledItem')}</p>
        {item.comment ? <p className="meta">{item.comment}</p> : null}
      </button>
      {trackQuantity ? (
        <button
          type="button"
          className="qty-badge"
          onClick={() => onOpenItem(item.id)}
          aria-label={t('list.quantity')}
        >
          {item.quantity}
        </button>
      ) : null}
    </div>
  )
}

export function SortableItemsList({
  items,
  trackQuantity,
  onReorder,
  onToggle,
  onOpenItem,
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
              onOpenItem={onOpenItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

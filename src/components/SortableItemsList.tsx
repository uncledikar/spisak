import type { Ref } from 'react'
import { useEffect, useMemo, useState } from 'react'
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
import type { ListItem } from '../types/models'
import { itemTintClass } from '../utils/itemColors'
import { reindexPositions } from '../utils/positions'

/** Matches CSS mobile breakpoint — hide handle, drag from whole row. */
const MOBILE_DRAG_MQ = '(max-width: 719px)'

function useMobileDragLayout(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_DRAG_MQ).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_DRAG_MQ)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}

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
  mobileDrag,
  onToggle,
  onOpenItem,
}: {
  item: ListItem
  trackQuantity: boolean
  mobileDrag: boolean
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

  const rowDragProps = mobileDrag ? { ...attributes, ...listeners } : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`item-row${trackQuantity ? '' : ' no-qty'}${item.checked ? ' checked' : ''}${isDragging ? ' dragging' : ''}${mobileDrag ? ' item-row-touch-drag' : ''}`}
      {...rowDragProps}
    >
      {!mobileDrag ? (
        <button
          type="button"
          className="drag-handle"
          aria-label={t('list.dragItem')}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      ) : null}
      <button
        type="button"
        className={`check${item.checked ? ' on' : ''}`}
        onClick={() => void onToggle(item.id)}
        onPointerDown={(e) => e.stopPropagation()}
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
        <span className="item-title-row">
          {tintClass ? (
            <span className={`item-color-dot ${tintClass}`} aria-hidden="true" />
          ) : null}
          <span className="item-title-text">
            <p className="item-name">{item.name || t('list.untitledItem')}</p>
            {item.comment ? <p className="meta">{item.comment}</p> : null}
          </span>
        </span>
      </button>
      {trackQuantity ? (
        <button
          type="button"
          className="qty-badge"
          onClick={() => onOpenItem(item.id)}
          onPointerDown={(e) => e.stopPropagation()}
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
  const mobileDrag = useMobileDragLayout()
  const ids = useMemo(() => items.map((item) => item.id), [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: mobileDrag
        ? { delay: 280, tolerance: 8 }
        : { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: mobileDrag ? 280 : 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    // Parent must update `items` synchronously — no await — or the list snaps back.
    onReorder(reindexPositions(arrayMove(items, oldIndex, newIndex)))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
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
              mobileDrag={mobileDrag}
              onToggle={onToggle}
              onOpenItem={onOpenItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

import type { Ref, SyntheticEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
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

/** Keep checkbox / qty taps from starting a row drag. */
function stopDragActivation(e: SyntheticEvent) {
  e.stopPropagation()
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
  suppressOpenClick,
  onToggle,
  onOpenItem,
}: {
  item: ListItem
  trackQuantity: boolean
  mobileDrag: boolean
  suppressOpenClick: () => boolean
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

  function openItem() {
    if (suppressOpenClick()) return
    onOpenItem(item.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`item-row${trackQuantity ? '' : ' no-qty'}${item.checked ? ' checked' : ''}${isDragging ? ' dragging' : ''}${mobileDrag ? ' item-row-touch-drag' : ''}`}
      {...(mobileDrag ? { ...attributes, ...listeners } : {})}
      onContextMenu={mobileDrag ? (e) => e.preventDefault() : undefined}
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
        data-no-dnd
        onClick={() => void onToggle(item.id)}
        onPointerDown={stopDragActivation}
        onTouchStart={stopDragActivation}
        aria-pressed={item.checked}
      >
        {item.checked ? '✓' : ''}
      </button>
      {/*
        On mobile the row owns TouchSensor listeners. Keep main as a div so iOS
        doesn't treat the press as a button "click wait" that kills long-press drag.
      */}
      {mobileDrag ? (
        <div
          className="item-row-main"
          role="button"
          tabIndex={0}
          onClick={openItem}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openItem()
            }
          }}
          aria-label={t('list.editItem')}
        >
          <ItemTitle tintClass={tintClass} name={item.name} comment={item.comment} untitled={t('list.untitledItem')} />
        </div>
      ) : (
        <button
          type="button"
          className="item-row-main"
          onClick={openItem}
          aria-label={t('list.editItem')}
        >
          <ItemTitle tintClass={tintClass} name={item.name} comment={item.comment} untitled={t('list.untitledItem')} />
        </button>
      )}
      {trackQuantity ? (
        <button
          type="button"
          className="qty-badge"
          data-no-dnd
          onClick={openItem}
          onPointerDown={stopDragActivation}
          onTouchStart={stopDragActivation}
          aria-label={t('list.quantity')}
        >
          {item.quantity}
        </button>
      ) : null}
    </div>
  )
}

function ItemTitle({
  tintClass,
  name,
  comment,
  untitled,
}: {
  tintClass?: string
  name: string
  comment: string
  untitled: string
}) {
  return (
    <span className="item-title-row">
      {tintClass ? <span className={`item-color-dot ${tintClass}`} aria-hidden="true" /> : null}
      <span className="item-title-text">
        <p className="item-name">{name || untitled}</p>
        {comment ? <p className="meta">{comment}</p> : null}
      </span>
    </span>
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
  /** Ignore the synthetic click that browsers fire after a touch-drag. */
  const suppressClickUntil = useRef(0)

  // Mouse for desktop handle; Touch for mobile long-press. Avoid PointerSensor —
  // on phones it fights TouchSensor and needs touch-action:none (breaks scroll).
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(_event: DragStartEvent) {
    setActiveId(String(_event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    suppressClickUntil.current = Date.now() + 400
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(reindexPositions(arrayMove(items, oldIndex, newIndex)))
  }

  function handleDragCancel() {
    setActiveId(null)
    suppressClickUntil.current = Date.now() + 400
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
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
              suppressOpenClick={() => Date.now() < suppressClickUntil.current}
              onToggle={onToggle}
              onOpenItem={onOpenItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

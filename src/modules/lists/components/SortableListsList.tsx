import type { SyntheticEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import type { ListRecord } from '../types/models'
import { ProgressBadge } from './ProgressBadge'
import { formatDeadline, formatRelative } from '../utils/dates'
import { reindexPositions } from '../utils/positions'
import { reorderLists } from '../api/lists'

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

function stopDragActivation(e: SyntheticEvent) {
  e.stopPropagation()
}

type Props = {
  lists: ListRecord[]
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

function ListCardBody({
  list,
  selectMode,
  selected,
  onToggleSelect,
}: {
  list: ListRecord
  selectMode: boolean
  selected: boolean
  onToggleSelect?: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const done = list.items.filter((i) => i.checked).length

  return (
    <>
      <div className="row-between">
        <div className="list-card-title-row">
          {selectMode ? (
            <input
              type="checkbox"
              className="list-select-check"
              checked={selected}
              onChange={() => onToggleSelect?.(list.id)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={stopDragActivation}
              onTouchStart={stopDragActivation}
              aria-label={t('lists.markList', { name: list.name })}
            />
          ) : null}
          <h2 className="card-title">{list.name}</h2>
        </div>
        <span onPointerDown={stopDragActivation} onTouchStart={stopDragActivation}>
          <ProgressBadge done={done} total={list.items.length} variant="chip" />
        </span>
      </div>
      <p className="meta">
        {list.deadline
          ? `${t('lists.deadline')}: ${formatDeadline(list.deadline, i18n.language)}`
          : t('lists.noDeadline')}
        {' · '}
        {t('lists.updated')} {formatRelative(list.updatedAt, i18n.language)}
      </p>
    </>
  )
}

function SortableListCard({
  list,
  mobileDrag,
  selectMode,
  selected,
  onToggleSelect,
  suppressOpenClick,
}: {
  list: ListRecord
  mobileDrag: boolean
  selectMode: boolean
  selected: boolean
  onToggleSelect?: (id: string) => void
  suppressOpenClick: () => boolean
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    disabled: selectMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function openList() {
    if (suppressOpenClick()) return
    navigate(`/lists/${list.id}`)
  }

  function activate() {
    if (selectMode) {
      onToggleSelect?.(list.id)
      return
    }
    openList()
  }

  const body = (
    <ListCardBody
      list={list}
      selectMode={selectMode}
      selected={selected}
      onToggleSelect={onToggleSelect}
    />
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card list-card-row${isDragging ? ' dragging' : ''}${mobileDrag && !selectMode ? ' list-card-touch-drag' : ''}${selected ? ' list-card-selected' : ''}`}
      {...(mobileDrag && !selectMode ? { ...attributes, ...listeners } : {})}
      onContextMenu={mobileDrag && !selectMode ? (e) => e.preventDefault() : undefined}
    >
      {!mobileDrag && !selectMode ? (
        <button
          type="button"
          className="drag-handle"
          aria-label={t('lists.dragList')}
          {...attributes}
          {...listeners}
          onClick={(e) => e.preventDefault()}
        >
          ⋮⋮
        </button>
      ) : null}

      {mobileDrag || selectMode ? (
        <div
          className="list-card-main"
          role="button"
          tabIndex={0}
          onClick={activate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              activate()
            }
          }}
        >
          {body}
        </div>
      ) : (
        <button type="button" className="list-card-main list-card-main-btn" onClick={activate}>
          {body}
        </button>
      )}
    </div>
  )
}

export function SortableListsList({
  lists,
  selectMode = false,
  selectedIds,
  onToggleSelect,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const mobileDrag = useMobileDragLayout()
  const ids = useMemo(() => lists.map((list) => list.id), [lists])
  const suppressClickUntil = useRef(0)
  const selected = selectedIds ?? new Set<string>()

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    suppressClickUntil.current = Date.now() + 400
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = lists.findIndex((list) => list.id === active.id)
    const newIndex = lists.findIndex((list) => list.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    void reorderLists(reindexPositions(arrayMove(lists, oldIndex, newIndex)))
  }

  function handleDragCancel() {
    setActiveId(null)
    suppressClickUntil.current = Date.now() + 400
  }

  const cards = lists.map((list) => (
    <SortableListCard
      key={list.id}
      list={list}
      mobileDrag={mobileDrag}
      selectMode={selectMode}
      selected={selected.has(list.id)}
      onToggleSelect={onToggleSelect}
      suppressOpenClick={() => Date.now() < suppressClickUntil.current}
    />
  ))

  if (selectMode) {
    return <div className="stack">{cards}</div>
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
        <div className={`stack${activeId ? ' sorting' : ''}`}>{cards}</div>
      </SortableContext>
    </DndContext>
  )
}

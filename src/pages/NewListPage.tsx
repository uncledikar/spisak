import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ListItem } from '../db/types'
import {
  createList,
  createListFromTemplate,
  emptyItem,
  getTemplates,
} from '../db/lists'
import { createId } from '../utils/id'
import { itemColorValue, isItemColorId, type ItemColorId } from '../utils/itemColors'
import { scrollItemIntoView } from '../utils/scroll'
import { ItemColorPicker } from '../components/ItemColorPicker'

function asColor(value: string | null | undefined): ItemColorId | null {
  return isItemColorId(value) ? value : null
}

export function NewListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const templateId = params.get('template')

  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [items, setItems] = useState<ListItem[]>([emptyItem()])
  const [ready, setReady] = useState(!templateId)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<Awaited<ReturnType<typeof getTemplates>>>([])

  useEffect(() => {
    if (!templateId) return
    void (async () => {
      const list = await createListFromTemplate(templateId)
      if (list) {
        navigate(`/lists/${list.id}`, { replace: true })
      } else {
        setReady(true)
      }
    })()
  }, [templateId, navigate])

  async function openTemplates() {
    setTemplates(await getTemplates())
    setShowTemplates(true)
  }

  function updateItem(id: string, patch: Partial<ListItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)))
  }

  function addItem() {
    const id = createId()
    setItems((prev) => [...prev, { ...emptyItem(), id }])
    scrollItemIntoView(id)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const cleaned = items
      .map((item) => ({
        ...item,
        name: item.name.trim(),
        comment: item.comment.trim(),
        quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
      }))
      .filter((item) => item.name.length > 0)

    const list = await createList({
      name,
      deadline: deadline || null,
      items: cleaned.length > 0 ? cleaned : [],
    })
    navigate(`/lists/${list.id}`, { replace: true })
  }

  if (!ready) {
    return (
      <div className="app-shell">
        <p className="meta">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="icon-btn" to="/" aria-label={t('nav.back')}>
          ←
        </Link>
        <h1>{t('lists.new')}</h1>
      </header>

      <div className="stack" style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => void openTemplates()}>
          {t('lists.fromTemplate')}
        </button>
      </div>

      <form onSubmit={(e) => void onSubmit(e)}>
        <div className="field">
          <label htmlFor="name">{t('list.name')}</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('list.namePlaceholder')}
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="deadline">{t('list.deadline')}</label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <h2 className="section-title">{t('list.items')}</h2>
        <div className="stack stack-items">
          {items.map((item) => (
            <div
              key={item.id}
              id={`item-editor-${item.id}`}
              className="item-editor"
              style={
                itemColorValue(item.color)
                  ? { background: itemColorValue(item.color) }
                  : undefined
              }
            >
              <input
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                placeholder={t('list.itemName')}
              />
              <div className="row">
                <input
                  className="qty-input"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, { quantity: Number(e.target.value) || 1 })
                  }
                  aria-label={t('list.quantity')}
                />
                <input
                  style={{ flex: 1 }}
                  value={item.comment}
                  onChange={(e) => updateItem(item.id, { comment: e.target.value })}
                  placeholder={t('list.commentPlaceholder')}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeItem(item.id)}
                  aria-label={t('list.delete')}
                >
                  ×
                </button>
              </div>
              <ItemColorPicker
                value={asColor(item.color)}
                onChange={(color) => updateItem(item.id, { color })}
              />
            </div>
          ))}
        </div>

        <div className="actions-bar">
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={addItem}
          >
            + {t('list.addItem')}
          </button>
          <button type="submit" className="btn btn-primary btn-block">
            {t('list.create')}
          </button>
        </div>
      </form>

      {showTemplates && (
        <div className="sheet" role="dialog" onClick={() => setShowTemplates(false)}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">{t('templates.title')}</h2>
            {templates.length === 0 ? (
              <p className="meta">{t('templates.empty')}</p>
            ) : (
              <div className="stack">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="card card-button"
                    onClick={() => {
                      setShowTemplates(false)
                      navigate(`/lists/new?template=${tpl.id}`)
                    }}
                  >
                    <h3 className="card-title">{tpl.name}</h3>
                    <p className="meta">{t('lists.itemsCount', { count: tpl.items.length })}</p>
                  </button>
                ))}
              </div>
            )}
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowTemplates(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

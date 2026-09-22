import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../api/categories'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { CategoryEditModal } from '../components/CategoryEditModal'
import { IconActionButton } from '../components/IconActionButton'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import type { Category } from '../types/models'

export function CategoriesPage() {
  const { t } = useTranslation()
  const categories = useLiveData(() => getCategories(), [])
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <PageShell title={t('finances.categories.title')}>
      {!categories ? (
        <p className="meta">{t('common.loading')}</p>
      ) : categories.length === 0 ? (
        <div className="empty">
          <h2>{t('finances.categories.empty')}</h2>
          <p>{t('finances.categories.emptyHint')}</p>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            {t('finances.categories.add')}
          </button>
        </div>
      ) : (
        <>
          <div className="catalog-add">
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              {t('common.add')}
            </button>
          </div>
          <ul className="list-plain stack">
            {categories.map((category) => (
              <li key={category.id} className="list-row card">
                <div className="medicine-line">
                  <span className="category-list-icon" aria-hidden="true">
                    {category.icon}
                  </span>
                  <strong className="card-title">{category.name}</strong>
                </div>
                <div className="row row-actions">
                  <IconActionButton label={t('common.edit')} onClick={() => setEditing(category)} />
                  <IconActionButton
                    label={t('common.delete')}
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(t('finances.categories.deleteConfirm'))) {
                        void deleteCategory(category.id)
                      }
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <CategoryEditModal
        open={creating || editing !== null}
        category={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSave={async ({ name, icon }) => {
          if (editing) {
            await updateCategory(editing.id, { name, icon })
          } else {
            await createCategory({ name, icon })
          }
        }}
      />
    </PageShell>
  )
}

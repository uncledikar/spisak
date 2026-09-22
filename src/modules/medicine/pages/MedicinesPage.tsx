import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createMedicine, deleteMedicine, getMedicines, updateMedicine } from '../api/medicines'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { IconActionButton } from '../components/IconActionButton'
import { MedicineEditModal } from '../components/MedicineEditModal'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import type { Medicine } from '../types/models'
import { formatUnitLabel } from '../utils/format'

export function MedicinesPage() {
  const { t } = useTranslation()
  const medicines = useLiveData(() => getMedicines(), [])
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <PageShell
      title={t('medicine.medicines.title')}
      pageActions={
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          {t('common.add')}
        </button>
      }
    >
      {!medicines ? (
        <p className="meta">{t('common.loading')}</p>
      ) : medicines.length === 0 ? (
        <div className="empty">
          <h2>{t('medicine.medicines.empty')}</h2>
          <p>{t('medicine.medicines.emptyHint')}</p>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            {t('medicine.medicines.add')}
          </button>
        </div>
      ) : (
        <ul className="list-plain stack">
          {medicines.map((medicine) => (
            <li key={medicine.id} className="list-row card">
              <div className="medicine-line">
                <strong className="card-title">{medicine.name}</strong>
                <span className="meta"> ({formatUnitLabel(medicine.unit, t)})</span>
              </div>
              <div className="row row-actions">
                <IconActionButton label={t('common.edit')} onClick={() => setEditing(medicine)} />
                <IconActionButton
                  label={t('common.delete')}
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(t('medicine.medicines.deleteConfirm'))) {
                      void deleteMedicine(medicine.id)
                    }
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <MedicineEditModal
        open={creating || editing !== null}
        medicine={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSave={async ({ name, unit }) => {
          if (editing) {
            await updateMedicine(editing.id, { name, unit })
          } else {
            await createMedicine({ name, unit })
          }
        }}
      />
    </PageShell>
  )
}

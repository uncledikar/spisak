import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Medicine } from '../types/models'

type Props = {
  open: boolean
  medicine: Medicine | null
  onClose: () => void
  onSave: (input: { name: string; unit: string }) => Promise<void>
}

export function MedicineEditModal({ open, medicine, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(medicine?.name ?? '')
    setUnit(medicine?.unit === 'pcs' || !medicine ? '' : medicine.unit)
  }, [open, medicine])

  if (!open) return null

  return (
    <div className="sheet" role="dialog" aria-label={medicine ? t('medicine.medicines.edit') : t('medicine.medicines.new')} onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{medicine ? t('medicine.medicines.edit') : t('medicine.medicines.new')}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim() || busy) return
            setBusy(true)
            void onSave({ name: name.trim(), unit: unit.trim() || 'pcs' })
              .then(onClose)
              .finally(() => setBusy(false))
          }}
        >
          <label className="field">
            <span>{t('medicine.medicines.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </label>
          <label className="field">
            <span>{t('medicine.medicines.unit')}</span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={t('medicine.medicines.unitPlaceholder')}
            />
          </label>
          <div className="row equal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

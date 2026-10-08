import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { logConsumption, updateConsumption } from '../api/consumptions'
import type { Consumption, Medicine } from '../types/models'
import { parseQtyInput } from '../utils/format'
import { commitDateInput } from '../../../shared/utils/dateInput'

type Props = {
  open: boolean
  onClose: () => void
  medicines: Medicine[]
  defaultDate: string
  consumption?: Consumption | null
}

export function LogConsumptionForm({
  open,
  onClose,
  medicines,
  defaultDate,
  consumption = null,
}: Props) {
  const { t } = useTranslation()
  const editing = Boolean(consumption)
  const [medicineId, setMedicineId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [consumedOn, setConsumedOn] = useState(defaultDate)
  const [busy, setBusy] = useState(false)
  const [medicineError, setMedicineError] = useState(false)

  useEffect(() => {
    if (!open) return
    if (consumption) {
      setMedicineId(consumption.medicineId)
      setQuantity(String(consumption.quantity))
      setConsumedOn(consumption.consumedOn)
    } else {
      setMedicineId('')
      setQuantity('1')
      setConsumedOn(defaultDate)
    }
    setMedicineError(false)
    setBusy(false)
  }, [open, defaultDate, consumption])

  if (!open) return null

  const title = editing ? t('medicine.today.edit') : t('medicine.today.log')

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{title}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        {medicines.length === 0 ? (
          <div className="stack">
            <p className="meta">{t('medicine.today.noMedicines')}</p>
            <Link className="btn btn-primary btn-block" to="/medicine/medicines" onClick={onClose}>
              {t('medicine.medicines.add')}
            </Link>
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (busy) return
              if (!medicineId) {
                setMedicineError(true)
                return
              }
              const qty = parseQtyInput(quantity)
              if (qty == null) return
              setMedicineError(false)
              setBusy(true)
              const task = consumption
                ? updateConsumption(consumption.id, {
                    medicineId,
                    quantity: qty,
                    consumedOn,
                  })
                : logConsumption({
                    medicineId,
                    quantity: qty,
                    consumedOn,
                  })
              void task.then(onClose).finally(() => setBusy(false))
            }}
          >
            <label className={`field field-medicine${medicineError ? ' field-invalid' : ''}`}>
              <select
                value={medicineId}
                aria-invalid={medicineError}
                aria-label={t('medicine.today.selectMedicine')}
                onChange={(e) => {
                  setMedicineId(e.target.value)
                  if (e.target.value) setMedicineError(false)
                }}
              >
                <option value="" disabled>
                  {t('medicine.today.selectMedicine')}
                </option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {medicineError ? (
                <span className="field-error-text">{t('medicine.today.medicineRequired')}</span>
              ) : null}
            </label>

            <div className="row log-fields">
              <label className="field field-qty">
                <span>{t('medicine.today.quantity')}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={() => {
                    const qty = parseQtyInput(quantity)
                    if (qty != null) setQuantity(String(qty))
                  }}
                  required
                />
              </label>
              <label className="field field-date grow">
                <span>{t('medicine.today.date')}</span>
                <input
                  type="date"
                  value={consumedOn}
                  onChange={(e) => commitDateInput(e, setConsumedOn)}
                  required
                />
              </label>
            </div>

            <div className="row equal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {editing ? t('common.save') : t('medicine.today.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

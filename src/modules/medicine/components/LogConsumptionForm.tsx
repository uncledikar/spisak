import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { logConsumption } from '../api/consumptions'
import type { Medicine } from '../types/models'
import { todayKey } from '../utils/periods'
import { commitDateInput } from '../../../shared/utils/dateInput'

type Props = {
  medicines: Medicine[]
}

export function LogConsumptionForm({ medicines }: Props) {
  const { t } = useTranslation()
  const [medicineId, setMedicineId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [consumedOn, setConsumedOn] = useState(todayKey())
  const [busy, setBusy] = useState(false)

  if (medicines.length === 0) {
    return (
      <div className="card log-card">
        <p className="meta">{t('medicine.today.noMedicines')}</p>
        <Link className="btn btn-primary btn-block" to="/medicine/medicines">
          {t('medicine.medicines.add')}
        </Link>
      </div>
    )
  }

  return (
    <form
      className="card log-card stack"
      onSubmit={(e) => {
        e.preventDefault()
        if (!medicineId || busy) return
        setBusy(true)
        void logConsumption({
          medicineId,
          quantity: Number(quantity) || 1,
          consumedOn,
        })
          .then(() => {
            setMedicineId('')
            setQuantity('1')
          })
          .finally(() => setBusy(false))
      }}
    >
      <h2 className="section-title">{t('medicine.today.log')}</h2>

      <label className="field field-medicine">
        <select
          value={medicineId}
          onChange={(e) => setMedicineId(e.target.value)}
          aria-label={t('medicine.today.selectMedicine')}
          required
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
      </label>

      <div className="row log-fields">
        <label className="field field-qty">
          <span>{t('medicine.today.quantity')}</span>
          <input
            type="number"
            min={0.01}
            step="any"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
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

      <button type="submit" className="btn btn-primary btn-block" disabled={busy || !medicineId}>
        {t('medicine.today.submit')}
      </button>
    </form>
  )
}

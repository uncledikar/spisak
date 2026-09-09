import { useTranslation } from 'react-i18next'
import { ITEM_COLORS, type ItemColorId } from '../utils/itemColors'

interface Props {
  value: ItemColorId | null
  onChange: (color: ItemColorId | null) => void
}

export function ItemColorPicker({ value, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <div className="color-picker" role="group" aria-label={t('list.color')}>
      <button
        type="button"
        className={`color-swatch color-swatch-none${value === null ? ' active' : ''}`}
        onClick={() => onChange(null)}
        title={t('list.colorNone')}
        aria-label={t('list.colorNone')}
        aria-pressed={value === null}
      />
      {ITEM_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className={`color-swatch${value === color.id ? ' active' : ''}`}
          style={{ background: color.value }}
          onClick={() => onChange(color.id)}
          title={t(`list.colors.${color.id}`)}
          aria-label={t(`list.colors.${color.id}`)}
          aria-pressed={value === color.id}
        />
      ))}
    </div>
  )
}

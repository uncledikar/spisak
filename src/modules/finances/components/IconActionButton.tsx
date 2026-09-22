type Props = {
  label: string
  onClick: () => void
  variant?: 'edit' | 'danger'
}

export function IconActionButton({ label, onClick, variant = 'edit' }: Props) {
  return (
    <button
      type="button"
      className={`icon-btn icon-action${variant === 'danger' ? ' icon-action-danger' : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {variant === 'danger' ? <TrashIcon /> : <EditIcon />}
    </button>
  )
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12.5 6.5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 7l1 12h8l1-12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

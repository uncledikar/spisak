/** Shown while auth / settings bootstrap — keeps brand + loader on screen (no blank root). */
export function BootSplash() {
  return (
    <div className="boot-splash" role="status" aria-live="polite" aria-label="SmartLife">
      <p className="boot-brand">SmartLife</p>
      <div className="boot-spinner" aria-hidden="true" />
    </div>
  )
}

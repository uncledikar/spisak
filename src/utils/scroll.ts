/** Scroll newly added list item into view after React paints. */
export function scrollItemIntoView(itemId: string): void {
  const run = () => {
    const el = document.getElementById(`item-editor-${itemId}`)
    if (!el) return false
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = el.querySelector<HTMLInputElement>('input')
    input?.focus({ preventScroll: true })
    return true
  }

  requestAnimationFrame(() => {
    if (run()) return
    requestAnimationFrame(() => {
      if (run()) return
      window.setTimeout(run, 50)
    })
  })
}

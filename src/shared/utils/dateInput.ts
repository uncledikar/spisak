/** Close native date picker after a value is chosen. */
export function commitDateInput(
  event: { currentTarget: HTMLInputElement; target: EventTarget },
  onValue: (value: string) => void,
): void {
  const input = event.currentTarget
  onValue(input.value)
  // Defer blur so the browser finishes applying the chosen value first.
  requestAnimationFrame(() => {
    input.blur()
  })
}

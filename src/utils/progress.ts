/** Round progress to nearest 10% (0–100). Empty list → 0. */
export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0
  const raw = (done / total) * 100
  return Math.min(100, Math.max(0, Math.round(raw / 10) * 10))
}

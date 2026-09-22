/** Rainbow from red (top / index 0) to violet (bottom). */
export function rainbowColor(index: number, total: number): string {
  if (total <= 1) return 'hsl(0 72% 48%)'
  const t = index / (total - 1)
  const hue = t * 270
  return `hsl(${hue.toFixed(1)} 70% 45%)`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Strip trailing localized "(copy)" / "(copy2)" / "(copy) (copy)" suffixes. */
export function stripCopySuffixes(name: string, copyLabel: string): string {
  const re = new RegExp(`^(.*?)\\s*\\(${escapeRegExp(copyLabel)}\\d*\\)$`, 'i')
  let base = name.trim()
  let prev = ''
  while (base !== prev) {
    prev = base
    const match = base.match(re)
    if (match) base = match[1].trimEnd()
  }
  return base
}

/**
 * Next copy title: Base → Base (copy) → Base (copy2) → Base (copy3)…
 * Avoids Base (copy) (copy) chains.
 */
export function nextCopyListName(
  sourceName: string,
  existingNames: string[],
  copyLabel: string,
): string {
  const base = stripCopySuffixes(sourceName, copyLabel)
  const re = new RegExp(`^${escapeRegExp(base)}\\s*\\(${escapeRegExp(copyLabel)}(\\d*)\\)$`, 'i')

  let maxN = 0
  for (const name of existingNames) {
    const match = name.trim().match(re)
    if (!match) continue
    const n = match[1] === '' ? 1 : Number(match[1])
    if (Number.isFinite(n) && n > maxN) maxN = n
  }

  const next = maxN + 1
  if (next === 1) return `${base} (${copyLabel})`
  return `${base} (${copyLabel}${next})`
}

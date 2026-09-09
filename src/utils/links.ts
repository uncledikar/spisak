export function normalizeLinkPair(
  a: string,
  b: string,
): { listIdA: string; listIdB: string } | null {
  if (a === b) return null
  return a < b ? { listIdA: a, listIdB: b } : { listIdA: b, listIdB: a }
}

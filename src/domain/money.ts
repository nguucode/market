// Formatting rules: spec/ia/rules.md#spec-conventions and #decisions-from-story-writing-2026-11-18.

const group = (n: number) => String(Math.trunc(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** `330.448₫`: dot thousands, no space, whole đồng. Negative amounts use a real minus sign. */
export function vnd(n: number): string {
  return `${n < 0 ? '−' : ''}${group(Math.round(n))}₫`
}

/** Signed money line for ledgers: `−30.000₫` / `+22.000₫`. */
export const signedVnd = (n: number) => (n > 0 ? `+${vnd(n)}` : vnd(n))

const oneDecimalDown = (x: number) => {
  const v = Math.floor(x * 10) / 10
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace('.', ',')
}

/** Compact money for chips and filters: `200K`, `1,2Tr`. Rounds down. */
export function compactVnd(n: number): string {
  if (n >= 1_000_000) return `${oneDecimalDown(n / 1_000_000)}Tr`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

/** Counts: `980`, `1,2k`, `1,2tr`. Rounds down to one decimal. */
export function compactCount(n: number): string {
  if (n >= 1_000_000) return `${oneDecimalDown(n / 1_000_000)}tr`
  if (n >= 1_000) return `${oneDecimalDown(n / 1_000)}k`
  return String(n)
}

/** Discount badge percent, rounded down: rules.md#price-display. */
export const discountPct = (price: number, before?: number) =>
  before && before > price ? Math.floor(((before - price) / before) * 100) : 0

/** Screen-reader text for an amount: "330.448 đồng". */
export const vndSpoken = (n: number) => `${group(n)} đồng`

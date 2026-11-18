// Shipping table: spec/ia/rules.md#shipping. A fixed table, no carrier API.
import type { ShippingOption } from './types'

const DAY = 86_400_000

/** Region of a province by its 2025 code: north, central, south. */
export function region(provinceCode: number): 'north' | 'central' | 'south' {
  if (provinceCode <= 38) return 'north' // Hà Nội … Thanh Hóa
  if (provinceCode <= 68) return 'central' // Nghệ An … Lâm Đồng
  return 'south'
}

export const OPTION_LABEL: Record<ShippingOption, string> = { express: 'Hỏa tốc', fast: 'Nhanh', economy: 'Tiết kiệm' }
export const CARRIER: Record<ShippingOption, string> = { express: 'Giao Liền', fast: 'Chim Én Express', economy: 'Bưu Kiện Mây' }

export type Quote = { option: ShippingOption; fee: number; eta: [number, number]; carrier: string }

/** Shipping options for one shop parcel: fee by distance + weight; Hỏa tốc only within one province. */
export function quoteShipping(fromProvince: number, toProvince: number, weightGrams: number, now: number): Quote[] {
  const same = fromProvince === toProvince
  const near = region(fromProvince) === region(toProvince)
  const base = same ? 22_000 : near ? 28_000 : 35_000
  const extraKg = Math.max(0, Math.ceil((weightGrams - 2000) / 1000))
  const surcharge = extraKg * 5_000
  const days = (min: number, max: number): [number, number] => [startOfDay(now + min * DAY), startOfDay(now + max * DAY)]
  const quotes: Quote[] = []
  if (same) quotes.push({ option: 'express', fee: 45_000 + surcharge, eta: days(0, 0), carrier: CARRIER.express })
  quotes.push({ option: 'fast', fee: base + surcharge, eta: same ? days(1, 2) : near ? days(2, 3) : days(3, 5), carrier: CARRIER.fast })
  quotes.push({ option: 'economy', fee: base - 6_000 + surcharge, eta: same ? days(2, 4) : near ? days(3, 5) : days(5, 7), carrier: CARRIER.economy })
  return quotes
}

/** Midnight in Vietnam time (UTC+7) for a timestamp. */
export function startOfDay(ms: number) {
  const off = 7 * 3_600_000
  return Math.floor((ms + off) / DAY) * DAY - off
}

const dm = (ms: number) => {
  const d = new Date(ms + 7 * 3_600_000)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
/** "Nhận hàng 21/11 – 23/11" or "Nhận hàng hôm nay". */
export function etaText([a, b]: [number, number], now: number) {
  if (b <= startOfDay(now)) return 'Nhận hàng hôm nay'
  return a === b ? `Nhận hàng ${dm(a)}` : `Nhận hàng ${dm(a)} – ${dm(b)}`
}

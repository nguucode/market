// Pure helpers for the product page (US-PDP-002, 004, 005, 006, 007, 008, 010). Each one has a test in pdp.test.ts.
import { flashFor } from '@/app/store'
import { discountPct, vnd } from '@/domain/money'
import { quoteShipping } from '@/domain/shipping'
import type { Category, Product, Review, Shop, Sku, Voucher } from '@/domain/types'
import type { World } from '@/mock/seed'

const HOUR = 3_600_000
export const MAX_DEAL_PCT = 50

/* ── Price block (US-PDP-002, rules.md#price-display) ─────────────── */

export type FlashInfo = { endsAt: number; limit: number; salePrice: number; soldOut: boolean }
export type PriceBlock = {
  kind: 'single' | 'range'
  price: number
  min: number
  max: number
  before?: number
  /** Badge for a single price, 0 when none. */
  pct: number
  /** "Giảm đến NN%" for a range, 0 when none. */
  maxPct: number
  flash?: FlashInfo
}

/** Discount percent with the 50% guard: above it the struck price is not shown (returns 0). */
export function safePct(price: number, before?: number, skuId?: string): number {
  const p = discountPct(price, before)
  if (p > MAX_DEAL_PCT) {
    if (import.meta.env?.DEV) console.warn(`[price] SKU ${skuId ?? '?'} discount ${p}% exceeds ${MAX_DEAL_PCT}%: struck price hidden`)
    return 0
  }
  return p
}

/** Flash-sale item for a SKU in the slot active at `t`, including sold-out ones. */
export function flashItemFor(w: World, skuId: string, t: number) {
  const slot = w.flashSlots.find((s) => s.startsAt <= t && t < s.endsAt)
  const item = slot?.items.find((i) => i.skuId === skuId)
  return slot && item ? { slot, item } : undefined
}

function current(w: World, k: Sku, t: number) {
  const f = flashFor(w, k.id, t)
  return f ? { price: f.item.salePrice, before: k.priceBeforePromo ?? k.price } : { price: k.price, before: k.priceBeforePromo }
}

export function priceBlock(w: World, skus: Sku[], sku: Sku | null, t: number): PriceBlock {
  const prices = skus.map((k) => ({ k, ...current(w, k, t) }))
  const min = Math.min(...prices.map((p) => p.price))
  const max = Math.max(...prices.map((p) => p.price))
  const flashSkus = sku ? [sku] : skus
  const fi = flashSkus.map((k) => flashItemFor(w, k.id, t)).find(Boolean)
  const flash = fi && { endsAt: fi.slot.endsAt, limit: fi.item.perBuyerLimit, salePrice: fi.item.salePrice, soldOut: fi.item.sold >= fi.item.quota }
  const shown = sku ? prices.find((p) => p.k.id === sku.id)! : min === max ? prices.find((p) => p.price === min)! : null
  if (shown) {
    const pct = safePct(shown.price, shown.before, shown.k.id)
    return { kind: 'single', price: shown.price, min, max, before: pct ? shown.before : undefined, pct, maxPct: 0, flash }
  }
  const maxPct = Math.max(0, ...prices.map((p) => safePct(p.price, p.before, p.k.id)))
  return { kind: 'range', price: min, min, max, pct: 0, maxPct, flash }
}

/** "2 giờ 05 phút" / "12 phút" / "dưới 1 phút": calm text, updated once a minute (rules.md#decisions). */
export function countdownText(ms: number): string {
  const m = Math.floor(Math.max(0, ms) / 60_000)
  if (m < 1) return 'dưới 1 phút'
  const h = Math.floor(m / 60)
  return h ? `${h} giờ ${String(m % 60).padStart(2, '0')} phút` : `${m} phút`
}

/* ── Quantity and actions (US-PDP-004) ────────────────────────────── */

export const clampQty = (qty: number, stock: number) => Math.max(1, Math.min(qty, Math.max(1, stock)))

/** Flash price covers the first `perBuyerLimit` units; the rest pay the normal price. */
export function flashSplit(qty: number, perBuyerLimit: number, alreadyBought = 0) {
  const flashQty = Math.max(0, Math.min(qty, perBuyerLimit - alreadyBought))
  return { flashQty, normalQty: qty - flashQty }
}

/** null when the add fits stock, else the units already in the cart. */
export const overStock = (inCart: number, qty: number, stock: number) => (inCart > 0 && inCart + qty > stock ? inCart : null)

/* ── Shipping (US-PDP-005) ────────────────────────────────────────── */

/** Fee range to any province for a buyer without an address: cheapest local option to the dearest far one. */
export function feeRange(fromProvince: number, weightGrams: number, t: number): [number, number] {
  const far = fromProvince <= 38 ? 79 : 1 // another region
  const near = quoteShipping(fromProvince, fromProvince, weightGrams, t).filter((q) => q.option !== 'express')
  const away = quoteShipping(fromProvince, far, weightGrams, t)
  return [Math.min(...near.map((q) => q.fee)), Math.max(...away.map((q) => q.fee))]
}

/* ── Shop (US-PDP-006) ────────────────────────────────────────────── */

export function moreFromShop(products: Product[], shopId: string, excludeId: string, n = 10) {
  return products.filter((p) => p.shopId === shopId && p.id !== excludeId && p.status === 'active').sort((a, b) => b.soldCount - a.soldCount).slice(0, n)
}

/* ── Specs (US-PDP-007) ───────────────────────────────────────────── */

export type SpecRow = { label: string; value: string; crumbs?: Category[] }
const REQUIRED = ['Thương hiệu', 'Xuất xứ', 'Nhà sản xuất']
/** Danh mục, Thương hiệu, Xuất xứ, Nhà sản xuất, other attributes in seed order, then Gửi từ. Empty values hidden except the required ones. */
export function specRows(p: Product, crumbs: Category[], shop: Shop): SpecRow[] {
  const attr = (l: string) => p.attributes.find((a) => a.label === l)?.value.trim() ?? ''
  const required = REQUIRED.map((label) => ({ label, value: attr(label) || (label === 'Thương hiệu' ? 'Không thương hiệu' : 'Đang cập nhật') }))
  const rest = p.attributes.filter((a) => !REQUIRED.includes(a.label) && a.label !== 'Kho hàng' && a.value.trim())
  return [{ label: 'Danh mục', value: crumbs.map((c) => c.name).join(' › '), crumbs }, ...required, ...rest, { label: 'Gửi từ', value: shop.provinceName || 'Nước ngoài' }]
}

export function warrantyText(p: Product, shop: Shop) {
  return p.attributes.find((a) => a.label === 'Bảo hành')?.value || shop.policies.warranty || 'Không bảo hành'
}

/* ── Vouchers (US-PDP-010) ────────────────────────────────────────── */

export const liveShopVouchers = (vouchers: Voucher[], shopId: string, t: number) =>
  vouchers.filter((v) => v.scope === 'shop' && v.shopId === shopId && !v.credit && v.startsAt <= t && t < v.endsAt)

export type SaveState = 'save' | 'saved' | 'used' | 'out'
export function voucherState(w: World, v: Voucher): SaveState {
  const saved = w.savedVouchers.find((s) => s.voucherId === v.id)
  if (saved) return saved.usedCount >= v.perBuyerLimit ? 'used' : 'saved'
  return v.usedCount >= v.totalQuota ? 'out' : 'save'
}

const dmy = (ms: number) => {
  const d = new Date(ms + 7 * HOUR)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
}
export const expiryText = (endsAt: number, t: number) =>
  endsAt - t < 24 * HOUR ? `Hết hạn sau ${Math.max(1, Math.ceil((endsAt - t) / HOUR))} giờ` : `HSD: ${dmy(endsAt)}`
export const dateText = dmy

/** "Giảm 15% Giảm tối đa 50.000₫" in full money for the sheet. */
export function voucherFull(v: Voucher) {
  if (v.kind === 'percent') return `Giảm ${v.value}%${v.maxDiscount ? ` Giảm tối đa ${vnd(v.maxDiscount)}` : ''}`
  return `Giảm ${vnd(v.value)}`
}

/* ── Reviews (US-PDP-008, rules.md#reviews) ───────────────────────── */

export type ReviewParams = { star?: number; media?: boolean; comment?: boolean; sku?: string }

export function parseReviewParams(q: URLSearchParams): ReviewParams {
  const star = Number(q.get('star'))
  return {
    star: Number.isInteger(star) && star >= 1 && star <= 5 ? star : undefined,
    media: q.get('media') === '1' || undefined,
    comment: q.get('comment') === '1' || undefined,
    sku: q.get('sku') || undefined,
  }
}

export function reviewSummary(reviews: Review[]) {
  const byStar = [0, 0, 0, 0, 0] // index 0 = 1 star
  let sum = 0
  for (const r of reviews) { byStar[r.rating - 1]++; sum += r.rating }
  const avg = reviews.length ? Math.round((sum / reviews.length) * 10 + 1e-9) / 10 : 0
  return { avg, count: reviews.length, byStar }
}

/** Newest first, ties by id; never reordered or hidden by rating beyond the buyer's own filter. */
export function filterReviews(reviews: Review[], p: ReviewParams): Review[] {
  return reviews
    .filter((r) => (!p.star || r.rating === p.star) && (!p.media || r.photos.length > 0) && (!p.comment || r.text.trim().length > 0) && (!p.sku || r.skuId === p.sku))
    .sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))
}

/** "Hương Giang" → "H***g". Already masked names pass through. */
export function maskName(name: string) {
  const s = name.replace(/\s+/g, '')
  if (s.includes('*') || s.length < 2) return name
  return `${s[0]}***${s[s.length - 1]}`.toLowerCase()
}

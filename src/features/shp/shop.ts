// Pure shop-page logic: US-SHP-001..004.
import type { Product, Review, Shop, Voucher } from '@/domain/types'
import { variantText, type World } from '@/mock/seed'
import { matchScore, normalizeVi, sortRows, type Row, type Sort } from '@/features/dsc/search'

export const SHOP_TABS = ['shop', 'products', 'categories', 'reviews', 'about'] as const
export type ShopTab = (typeof SHOP_TABS)[number]
export const TAB_LABEL: Record<ShopTab, string> = { shop: 'Shop', products: 'Sản phẩm', categories: 'Danh mục', reviews: 'Đánh giá', about: 'Giới thiệu' }
/** `null` → no tab (default "shop"); an unknown value is reported so the page can rewrite it. */
export function parseShopTab(v: string | null): { tab: ShopTab; valid: boolean } {
  if (v === null) return { tab: 'shop', valid: true }
  return (SHOP_TABS as readonly string[]).includes(v) ? { tab: v as ShopTab, valid: true } : { tab: 'shop', valid: false }
}

export const SHOP_SORTS: Sort[] = ['popular', 'newest', 'bestselling', 'price_asc', 'price_desc']

export function shopCategoryCounts(rows: Row[], shop: Shop) {
  return shop.shopCategories.map((c) => ({ ...c, n: rows.filter((r) => r.shop.id === shop.id && r.p.categoryId === c.id).length }))
}

/** The shop's active products for cat + q, sorted; "Phổ biến" by default, "Liên quan" when searching. */
export function shopProducts(rows: Row[], shopId: string, p: { cat?: string; q?: string; sort?: Sort }): Row[] {
  const qn = normalizeVi(p.q ?? '')
  const scores = new Map<string, number>()
  const hits = rows.filter((r) => {
    if (r.shop.id !== shopId || (p.cat && r.p.categoryId !== p.cat)) return false
    const s = matchScore(r, qn); if (s) scores.set(r.p.id, s); return s > 0
  })
  return sortRows(hits, p.sort ?? (qn ? 'relevance' : 'popular'), scores)
}

/* ── Vouchers ─────────────────────────────────────────────────────── */

export const liveShopVouchers = (w: World, shopId: string, t: number) =>
  w.vouchers.filter((v) => v.scope === 'shop' && v.shopId === shopId && !v.credit && v.startsAt <= t && t < v.endsAt)

export type VoucherButton = 'save' | 'saved' | 'sold_out' | 'used'
export function voucherButtonState(v: Voucher, saved: boolean, usedCount: number, _now: number): VoucherButton {
  if (usedCount >= v.perBuyerLimit) return 'used'
  if (v.usedCount >= v.totalQuota) return 'sold_out'
  return saved ? 'saved' : 'save'
}

const pad = (n: number) => String(n).padStart(2, '0')
export const fmtDate = (ms: number) => { const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
export function expiryText(endsAt: number, t: number) {
  const h = (endsAt - t) / 3_600_000
  return h < 24 ? `Hết hạn sau ${Math.max(1, Math.ceil(h))} giờ` : `HSD: ${fmtDate(endsAt)}`
}

/* ── Reviews ──────────────────────────────────────────────────────── */

export type ShopReview = { review: Review; product: Product; linkable: boolean; variant: string }
/** Every review of the shop's products (delisted ones included), newest first. */
export function shopReviews(w: World, shopId: string): ShopReview[] {
  const products = new Map(w.products.filter((p) => p.shopId === shopId).map((p) => [p.id, p]))
  const skus = new Map(w.skus.map((k) => [k.id, k]))
  return w.reviews.filter((r) => products.has(r.productId)).map((review) => {
    const product = products.get(review.productId)!
    const k = skus.get(review.skuId)
    return { review, product, linkable: product.status === 'active', variant: k ? variantText(product, k) : '' }
  }).sort((a, b) => b.review.createdAt - a.review.createdAt || (a.review.id < b.review.id ? 1 : -1))
}
export function reviewSummary(list: ShopReview[]) {
  const dist = [5, 4, 3, 2, 1].map((s) => ({ star: s, n: list.filter((x) => x.review.rating === s).length }))
  const avg = list.length ? Math.round((list.reduce((a, x) => a + x.review.rating, 0) / list.length) * 10) / 10 : 0
  return { avg, count: list.length, dist, media: list.filter((x) => x.review.photos.length > 0).length }
}
export const filterReviews = (list: ShopReview[], f: { star?: number; media?: boolean }) =>
  list.filter((x) => (!f.star || x.review.rating === f.star) && (!f.media || x.review.photos.length > 0))

import { describe, expect, it, vi } from 'vitest'
import type { Product, Review, Shop, Sku, Voucher } from '@/domain/types'
import type { World } from '@/mock/seed'
import {
  clampQty, countdownText, expiryText, filterReviews, flashSplit, maskName, moreFromShop, overStock, parseReviewParams, priceBlock, reviewSummary, safePct, specRows, voucherState,
} from './pdp'

const T = Date.UTC(2026, 10, 18, 3)
const sku = (id: string, price: number, before?: number, stock = 5): Sku => ({ id, productId: 'p', optionIds: [], price, priceBeforePromo: before, stock })
const world = (over: Partial<World> = {}) => ({ flashSlots: [], savedVouchers: [], ...over }) as unknown as World

describe('priceBlock', () => {
  it('shows a single price when all SKUs match', () => {
    const b = priceBlock(world(), [sku('a', 189_000), sku('b', 189_000)], null, T)
    expect(b).toMatchObject({ kind: 'single', price: 189_000, pct: 0 })
  })
  it('shows a range with "Giảm đến" the largest discount until a SKU is picked', () => {
    const ks = [sku('a', 189_000, 210_000), sku('b', 249_000, 415_000), sku('c', 220_000)]
    expect(priceBlock(world(), ks, null, T)).toMatchObject({ kind: 'range', min: 189_000, max: 249_000, maxPct: 40 })
    expect(priceBlock(world(), ks, null, T).before).toBeUndefined()
    expect(priceBlock(world(), ks, ks[0], T)).toMatchObject({ kind: 'single', price: 189_000, before: 210_000, pct: 10 })
  })
  it('hides a struck price above 50% and allows exactly 50%', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(safePct(49_000, 100_000)).toBe(0)
    expect(safePct(50_000, 100_000)).toBe(50)
    warn.mockRestore()
  })
  it('uses the flash price inside the slot and reports sold-out quota', () => {
    const ks = [sku('a', 200_000), sku('b', 300_000)]
    const slot = (sold: number) => ({ id: 's', startsAt: T - 1000, endsAt: T + 1000, items: [{ skuId: 'a', productId: 'p', salePrice: 150_000, quota: 10, sold, perBuyerLimit: 2 }] })
    const live = priceBlock(world({ flashSlots: [slot(3)] }), ks, ks[0], T)
    expect(live).toMatchObject({ price: 150_000, before: 200_000, flash: { limit: 2, soldOut: false } })
    const out = priceBlock(world({ flashSlots: [slot(10)] }), ks, ks[0], T)
    expect(out).toMatchObject({ price: 200_000, flash: { soldOut: true } })
    expect(priceBlock(world({ flashSlots: [slot(3)] }), ks, ks[0], T + 2000).flash).toBeUndefined()
  })
})

describe('quantity', () => {
  it('splits flash and normal units', () => {
    expect(flashSplit(3, 2)).toEqual({ flashQty: 2, normalQty: 1 })
    expect(flashSplit(1, 2)).toEqual({ flashQty: 1, normalQty: 0 })
  })
  it('clamps and detects over-stock adds', () => {
    expect(clampQty(9, 3)).toBe(3)
    expect(clampQty(0, 3)).toBe(1)
    expect(overStock(2, 2, 3)).toBe(2)
    expect(overStock(0, 2, 3)).toBeNull()
    expect(overStock(1, 2, 3)).toBeNull()
  })
  it('formats a calm countdown', () => {
    expect(countdownText(2 * 3_600_000 + 5 * 60_000 + 30_000)).toBe('2 giờ 05 phút')
    expect(countdownText(12 * 60_000)).toBe('12 phút')
    expect(countdownText(20_000)).toBe('dưới 1 phút')
  })
})

describe('shop and specs', () => {
  const prod = (id: string, sold: number, status: Product['status'] = 'active', shopId = 's1') => ({ id, shopId, soldCount: sold, status }) as Product
  it('lists more from the shop by soldCount, without this or delisted products', () => {
    const list = moreFromShop([prod('a', 5), prod('b', 50), prod('c', 99, 'delisted'), prod('d', 7, 'active', 's2'), prod('x', 1000)], 's1', 'x')
    expect(list.map((p) => p.id)).toEqual(['b', 'a'])
  })
  it('orders spec rows with the required ones guaranteed', () => {
    const p = { attributes: [{ label: 'Chất liệu', value: 'Cotton' }, { label: 'Xuất xứ', value: 'Việt Nam' }, { label: 'Dung tích', value: ' ' }, { label: 'Kho hàng', value: 'Đà Nẵng' }] } as Product
    const rows = specRows(p, [{ id: 'c', slug: 'c', name: 'Thời trang', level: 1 }], { provinceName: 'Đà Nẵng' } as Shop)
    expect(rows.map((r) => r.label)).toEqual(['Danh mục', 'Thương hiệu', 'Xuất xứ', 'Nhà sản xuất', 'Chất liệu', 'Gửi từ'])
  })
})

describe('vouchers', () => {
  const v = (o: Partial<Voucher>) => ({ id: 'v', perBuyerLimit: 1, usedCount: 0, totalQuota: 10, ...o }) as Voucher
  it('derives the save button state', () => {
    expect(voucherState(world(), v({}))).toBe('save')
    expect(voucherState(world(), v({ usedCount: 10 }))).toBe('out')
    expect(voucherState(world({ savedVouchers: [{ voucherId: 'v', savedAt: 0, usedCount: 0 }] }), v({}))).toBe('saved')
    expect(voucherState(world({ savedVouchers: [{ voucherId: 'v', savedAt: 0, usedCount: 1 }] }), v({}))).toBe('used')
  })
  it('shows hours under a day, else the date', () => {
    expect(expiryText(T + 2 * 3_600_000, T)).toBe('Hết hạn sau 2 giờ')
    expect(expiryText(Date.UTC(2026, 10, 30, 5), T)).toBe('HSD: 30/11/2026')
  })
})

describe('reviews', () => {
  const r = (id: string, rating: number, at: number, o: Partial<Review> = {}) => ({ id, rating, createdAt: at, photos: [], text: 'ok', skuId: 'k1', ...o }) as Review
  const list = [r('r1', 5, 3), r('r2', 1, 9, { photos: ['x'] }), r('r3', 3, 5, { text: '' }), r('r4', 1, 9, { skuId: 'k2' })]
  it('summarises average half-up and per-star counts', () => {
    expect(reviewSummary(list)).toEqual({ avg: 2.5, count: 4, byStar: [2, 0, 1, 0, 1] })
    expect(reviewSummary([r('a', 4, 1), r('b', 5, 1)]).avg).toBe(4.5)
  })
  it('sorts newest first, never by rating, and combines filters', () => {
    expect(filterReviews(list, {}).map((x) => x.id)).toEqual(['r2', 'r4', 'r3', 'r1'])
    expect(filterReviews(list, { star: 1, media: true }).map((x) => x.id)).toEqual(['r2'])
    expect(filterReviews(list, { comment: true, sku: 'k1' }).map((x) => x.id)).toEqual(['r2', 'r1'])
  })
  it('drops invalid params', () => {
    expect(parseReviewParams(new URLSearchParams('star=7&media=1&comment=yes&sku='))).toEqual({ star: undefined, media: true, comment: undefined, sku: undefined })
  })
  it('masks names', () => {
    expect(maskName('Hương Giang')).toBe('h***g')
    expect(maskName('h***a')).toBe('h***a')
  })
})

import { describe, expect, it } from 'vitest'
import type { Voucher } from '@/domain/types'
import { seedWorld } from '@/mock/seed'
import { buildIndex } from '@/features/dsc/search'
import { expiryText, filterReviews, liveShopVouchers, parseShopTab, reviewSummary, shopCategoryCounts, shopProducts, shopReviews, voucherButtonState } from './shop'

const t = Date.now()
const w = seedWorld(t)
const rows = buildIndex(w, t)
const shop = [...w.shops].sort((a, b) => rows.filter((r) => r.shop.id === b.id).length - rows.filter((r) => r.shop.id === a.id).length)[0]

describe('shop', () => {
  it('parses the tab', () => {
    expect(parseShopTab(null)).toEqual({ tab: 'shop', valid: true })
    expect(parseShopTab('reviews')).toEqual({ tab: 'reviews', valid: true })
    expect(parseShopTab('xyz')).toEqual({ tab: 'shop', valid: false })
  })
  it('counts shop categories over active products', () => {
    const counts = shopCategoryCounts(rows, shop)
    expect(counts.reduce((a, c) => a + c.n, 0)).toBe(rows.filter((r) => r.shop.id === shop.id).length)
  })
  it('lists only this shop, popular by default with sold-out last, searchable without diacritics', () => {
    const all = shopProducts(rows, shop.id, {})
    expect(all.every((r) => r.shop.id === shop.id)).toBe(true)
    const firstOut = all.findIndex((r) => !r.inStock)
    if (firstOut >= 0) expect(all.slice(firstOut).every((r) => !r.inStock)).toBe(true)
    const word = all[0].text.name.split(' ')[0]
    expect(shopProducts(rows, shop.id, { q: word.toUpperCase() }).length).toBeGreaterThan(0)
    const cat = shop.shopCategories[0].id
    expect(shopProducts(rows, shop.id, { cat }).every((r) => r.p.categoryId === cat)).toBe(true)
  })
  it('shows live vouchers and their button state', () => {
    const v = { perBuyerLimit: 1, usedCount: 0, totalQuota: 10 } as Voucher
    expect(voucherButtonState(v, false, 0, t)).toBe('save')
    expect(voucherButtonState(v, true, 0, t)).toBe('saved')
    expect(voucherButtonState({ ...v, usedCount: 10 }, true, 0, t)).toBe('sold_out')
    expect(voucherButtonState(v, true, 1, t)).toBe('used')
    expect(liveShopVouchers(w, shop.id, t).every((x) => x.endsAt > t)).toBe(true)
  })
  it('formats expiry', () => {
    expect(expiryText(t + 2 * 3_600_000 - 1000, t)).toBe('Hết hạn sau 2 giờ')
    expect(expiryText(new Date(2026, 10, 30).getTime(), new Date(2026, 10, 1).getTime())).toBe('HSD: 30/11/2026')
  })
  it('joins reviews newest first and summarises them', () => {
    const list = shopReviews(w, shop.id)
    for (let i = 1; i < list.length; i++) expect(list[i].review.createdAt).toBeLessThanOrEqual(list[i - 1].review.createdAt)
    const s = reviewSummary(list)
    expect(s.dist.reduce((a, d) => a + d.n, 0)).toBe(s.count)
    expect(filterReviews(list, { star: 5 }).every((x) => x.review.rating === 5)).toBe(true)
    expect(reviewSummary([])).toMatchObject({ avg: 0, count: 0 })
  })
})

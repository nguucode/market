import { allocate, bestVoucher, ineligibility, price, voucherDiscount, voucherLabel } from './pricing'
import type { Voucher } from './types'

const NOW = Date.UTC(2026, 10, 18)
const v = (o: Partial<Voucher>): Voucher => ({
  id: 'v', code: 'V', scope: 'shop', kind: 'amount', value: 0, minSpend: 0,
  startsAt: NOW - 1, endsAt: NOW + 86_400_000, totalQuota: 100, usedCount: 0, perBuyerLimit: 1, ...o,
})

// Research §4.3 worked example (rules.md#voucher-math item 7).
const shopA = v({ id: 'sa', shopId: 'A', value: 30_000, minSpend: 450_000 })
const shopB = v({ id: 'sb', shopId: 'B', value: 20_000, minSpend: 299_000 })
const platform = v({ id: 'p', scope: 'platform', kind: 'percent', value: 15, maxDiscount: 50_000 })
const freeship = v({ id: 'f', scope: 'shipping', value: 25_000, maxPerShop: 25_000 })
const fixture = {
  shops: [
    { shopId: 'A', lines: [{ id: 'a1', unitPrice: 298_000, qty: 1 }, { id: 'a2', unitPrice: 180_000, qty: 1 }], shippingFee: 22_000, shopVoucher: shopA },
    { shopId: 'B', lines: [{ id: 'b1', unitPrice: 245_000, qty: 1 }], shippingFee: 35_000, shopVoucher: shopB },
  ],
  platformVoucher: platform,
  shippingVoucher: freeship,
  ctx: { now: NOW },
}

test('allocate splits by largest remainder and always sums to the total', () => {
  expect(allocate(50_000, [448_000, 245_000])).toEqual([32_323, 17_677])
  expect(allocate(12_000, [415_677, 237_323])).toEqual([7_639, 4_361])
  expect(allocate(10, [1, 1, 1])).toEqual([4, 3, 3])
  expect(allocate(0, [5, 5])).toEqual([0, 0])
  for (const t of [1, 7, 99_999, 123_457]) expect(allocate(t, [3, 11, 17, 29]).reduce((a, b) => a + b)).toBe(t)
})

test('§4.3 worked example without Xu: 723.000₫ goods → 653.000₫, orders 415.677₫ + 237.323₫', () => {
  const r = price(fixture)
  expect(r.goods).toBe(723_000)
  expect(r.shopDiscount).toBe(30_000) // B is below its minimum and is dropped
  expect(r.dropped).toEqual([{ voucher: shopB, reason: { kind: 'min_spend', missing: 54_000 } }])
  expect(r.platformDiscount).toBe(50_000) // 15% of 693.000 = 103.950, capped
  expect(r.shops.map((s) => s.platformShare)).toEqual([32_323, 17_677])
  expect(r.shops.map((s) => s.shippingDiscount)).toEqual([22_000, 25_000])
  expect(r.shops.map((s) => s.total)).toEqual([415_677, 237_323])
  expect(r.total).toBe(653_000)
})

test('§4.3 with 12.000 Xu gives 641.000₫ and the orders still sum', () => {
  const r = price({ ...fixture, coins: 12_000 })
  expect(r.shops.map((s) => s.total)).toEqual([408_038, 232_962])
  expect(r.total).toBe(641_000)
})

test('Xu are capped at 50% of payable', () => {
  const r = price({ shops: [{ shopId: 'A', lines: [{ id: 'x', unitPrice: 100_000, qty: 1 }], shippingFee: 0 }], coins: 90_000, ctx: { now: NOW } })
  expect(r.coins).toBe(50_000)
})

test('percent discount floors and respects the cap; amount never exceeds base', () => {
  expect(voucherDiscount(v({ kind: 'percent', value: 15 }), 693_001)).toBe(103_950)
  expect(voucherDiscount(v({ kind: 'percent', value: 15, maxDiscount: 50_000 }), 693_000)).toBe(50_000)
  expect(voucherDiscount(v({ value: 30_000 }), 20_000)).toBe(20_000)
})

test('ineligibility names the reason', () => {
  expect(ineligibility(v({ minSpend: 100 }), 40, { now: NOW })).toEqual({ kind: 'min_spend', missing: 60 })
  expect(ineligibility(v({ endsAt: NOW }), 40, { now: NOW })).toEqual({ kind: 'expired' })
  expect(ineligibility(v({ usedCount: 100 }), 40, { now: NOW })).toEqual({ kind: 'out_of_quota' })
  expect(ineligibility(v({ paymentMethods: ['wallet'] }), 40, { now: NOW, paymentMethod: 'cod' })).toEqual({ kind: 'payment_method', methods: ['wallet'] })
  expect(ineligibility(v({}), 40, { now: NOW, usedByBuyer: 1 })).toEqual({ kind: 'used_up' })
})

test('a platform voucher restricted to a payment method drops when the method changes', () => {
  const r = price({ ...fixture, platformVoucher: { ...platform, paymentMethods: ['wallet'] }, ctx: { now: NOW, paymentMethod: 'cod' } })
  expect(r.platformDiscount).toBe(0)
  expect(r.dropped.map((d) => d.reason.kind)).toContain('payment_method')
})

test('bestVoucher picks the largest discount, ties by earliest expiry', () => {
  const a = v({ id: 'a', value: 20_000, endsAt: NOW + 5000 })
  const b = v({ id: 'b', value: 20_000, endsAt: NOW + 1000 })
  const c = v({ id: 'c', value: 50_000, minSpend: 999_999 })
  expect(bestVoucher([a, b, c], 300_000, { now: NOW })?.id).toBe('b')
})

test('voucher labels', () => {
  expect(voucherLabel(platform)).toBe('Giảm 15% tối đa 50K')
  expect(voucherLabel(shopA)).toBe('Giảm 30K')
  expect(voucherLabel(freeship)).toBe('Miễn phí vận chuyển tối đa 25K')
})

import { price } from '@/domain/pricing'
import { quoteShipping } from '@/domain/shipping'
import type { OrderStatus } from '@/domain/types'
import { seedWorld } from './seed'

const NOW = Date.UTC(2026, 10, 18, 5)
const w = seedWorld(NOW)

test('deterministic', () => {
  expect(JSON.stringify(seedWorld(NOW))).toBe(JSON.stringify(w))
})

test('no SKU is more than 50% off its price before the promotion (rules.md#price-display)', () => {
  for (const k of w.skus) if (k.priceBeforePromo) expect(k.price).toBeGreaterThanOrEqual(k.priceBeforePromo * 0.5)
  for (const s of w.flashSlots) for (const i of s.items) {
    const k = w.skus.find((x) => x.id === i.skuId)!
    expect(i.salePrice).toBeGreaterThanOrEqual((k.priceBeforePromo ?? k.price) * 0.5)
  }
})

test('the seeded cart reproduces the §4.3 worked example: 653.000₫', () => {
  const lines = w.cart.filter((l) => l.selected).map((l) => ({ l, k: w.skus.find((k) => k.id === l.skuId)! }))
  const byShop = new Map<string, typeof lines>()
  for (const x of lines) {
    const shopId = w.products.find((p) => p.id === x.k.productId)!.shopId
    byShop.set(shopId, [...(byShop.get(shopId) ?? []), x])
  }
  const r = price({
    shops: [...byShop].map(([shopId, xs]) => {
      const shop = w.shops.find((s) => s.id === shopId)!
      return {
        shopId,
        lines: xs.map(({ l, k }) => ({ id: l.id, unitPrice: k.price, qty: l.qty })),
        shippingFee: quoteShipping(shop.provinceCode, 48, 600, NOW).find((q) => q.option === 'fast')!.fee,
        shopVoucher: w.vouchers.find((v) => v.scope === 'shop' && v.shopId === shopId),
      }
    }),
    platformVoucher: w.vouchers.find((v) => v.id === 'mk15'),
    shippingVoucher: w.vouchers.find((v) => v.id === 'fs25'),
    ctx: { now: NOW },
  })
  expect(r.goods).toBe(723_000)
  expect(r.total).toBe(653_000)
})

test('every order status and the cart edge cases exist', () => {
  const statuses: OrderStatus[] = ['awaiting_payment', 'to_confirm', 'to_ship', 'shipping', 'delivered', 'completed', 'cancelled', 'return_requested', 'returned']
  for (const s of statuses) expect(w.orders.some((o) => o.status === s)).toBe(true)
  const skuOf = (id: string) => w.skus.find((k) => k.id === id)!
  expect(w.cart.some((l) => skuOf(l.skuId).stock === 0)).toBe(true)
  expect(w.cart.some((l) => w.products.find((p) => p.id === skuOf(l.skuId).productId)!.status === 'delisted')).toBe(true)
  expect(w.shops.some((s) => !s.codEnabled)).toBe(true)
  expect(w.products.some((p) => p.name.length >= 120)).toBe(true)
  expect(w.notifications.filter((n) => !n.read)).toHaveLength(6)
})

test('every order total equals its money lines', () => {
  for (const o of w.orders) expect(o.total).toBe(o.goods - o.shopDiscount - o.platformDiscount + o.shippingFee - o.shippingDiscount)
})

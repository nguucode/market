import { allowedActions, canReview, refundDestination, refundSplit, tabOf } from './orders'
import type { Order } from './types'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 18)
const base: Order = {
  id: 'MK1', paymentId: 'P1', shopId: 'A', status: 'to_confirm',
  lines: [
    { id: 'a1', productId: 'p1', skuId: 's1', name: 'Áo', variantText: '', image: '', unitPrice: 298_000, qty: 1 },
    { id: 'a2', productId: 'p2', skuId: 's2', name: 'Cốc', variantText: '', image: '', unitPrice: 180_000, qty: 1 },
  ],
  goods: 478_000, shippingFee: 22_000, shopDiscount: 30_000, platformDiscount: 32_323, shippingDiscount: 22_000, total: 415_677,
  vouchers: [], address: {} as Order['address'], shippingOption: 'fast', carrier: '', eta: [0, 0], paymentMethod: 'cod',
  paymentStatus: 'unpaid', createdAt: NOW - 3 * DAY, at: {}, trackingCode: '',
}
const o = (p: Partial<Order>): Order => ({ ...base, ...p })

test('cancel is immediate before pickup, a one-shot request after', () => {
  expect(allowedActions(o({ status: 'to_confirm' }), NOW, true)).toContain('cancel')
  expect(allowedActions(o({ status: 'to_ship' }), NOW, true)).toContain('request_cancel')
  const refused = o({ status: 'to_ship', cancelRequest: { status: 'refused', reason: 'x', at: NOW } })
  expect(allowedActions(refused, NOW, true)).not.toContain('request_cancel')
  expect(allowedActions(o({ status: 'shipping' }), NOW, true)).not.toContain('cancel')
})

test('unpaid order can be paid only while its payment is open', () => {
  expect(allowedActions(o({ status: 'awaiting_payment' }), NOW, true)[0]).toBe('pay')
  expect(allowedActions(o({ status: 'awaiting_payment' }), NOW, false)).toEqual(['cancel'])
})

test('return window is 15 days from delivery', () => {
  const d = o({ status: 'delivered', at: { delivered: NOW - 14 * DAY } })
  expect(allowedActions(d, NOW, false)).toContain('return')
  expect(allowedActions({ ...d, at: { delivered: NOW - 16 * DAY } }, NOW, false)).not.toContain('return')
})

test('review window: 30 days after completion, never once every line is reviewed', () => {
  expect(canReview(o({ status: 'completed', at: { delivered: NOW - 40 * DAY, completed: NOW - 29 * DAY } }), NOW)).toBe(true)
  expect(canReview(o({ status: 'completed', at: { completed: NOW - 31 * DAY } }), NOW)).toBe(false)
  const reviewed = o({ status: 'completed', at: { completed: NOW }, lines: base.lines.map((l) => ({ ...l, reviewId: 'r' })) })
  expect(canReview(reviewed, NOW)).toBe(false)
})

test('refund split for one line of the §4.3 Shop A order', () => {
  expect(refundSplit(base, ['a2'])).toEqual({ goods: 180_000, shopShare: 11_297, platformShare: 12_172, cash: 156_531, voucherCredit: 12_172, shipping: 0 })
})

test('returning every line gives back the order total in cash + credit', () => {
  const r = refundSplit(base, ['a1', 'a2'])
  expect(r.cash + r.voucherCredit).toBe(base.total + base.platformDiscount)
  expect(r.cash).toBe(415_677)
})

test('tabs and refund destinations', () => {
  expect(tabOf(o({ status: 'completed' }))).toBe('delivered')
  expect(tabOf(o({ status: 'to_confirm' }))).toBe('to_ship')
  expect(refundDestination('cod', false)).toBeNull()
  expect(refundDestination('card', true)?.eta).toBe('7–14 ngày làm việc')
})

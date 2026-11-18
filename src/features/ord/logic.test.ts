import type { Order } from '@/domain/types'
import { seedWorld } from '@/mock/seed'
import {

  buyAgainToast, calendarDaysLeft, cancelMode, canRequestReturn, dmy, dmyhm, invoiceAvailable, orderEvents, ordersInTab, ordersSharingPayment, parseTab,
  paymentRows, primaryAction, refundCopy, refundInfo, reviewBannerText, reviewPrompt, statusSentence, tabCounts, timeLeft, visibleActions, whoCancelled,
} from './logic'

/** A wall-clock time in Vietnam (UTC+7), so tests pass in any runner timezone. */
const vnt = (y: number, mo: number, d: number, h = 0, mi = 0) => Date.UTC(y, mo, d, h, mi) - 7 * 3_600_000

const DAY = 86_400_000
const NOW = vnt(2026, 10, 18, 14, 5)
const base: Order = {
  id: 'MK1', paymentId: 'P1', shopId: 'A', status: 'to_confirm',
  lines: [
    { id: 'a1', productId: 'p1', skuId: 's1', name: 'Áo', variantText: '', image: '', unitPrice: 149_000, qty: 2 },
    { id: 'a2', productId: 'p2', skuId: 's2', name: 'Cốc', variantText: '', image: '', unitPrice: 180_000, qty: 1 },
  ],
  goods: 478_000, shippingFee: 22_000, shopDiscount: 30_000, platformDiscount: 32_323, shippingDiscount: 22_000, total: 415_677,
  vouchers: [
    { voucherId: 'v1', scope: 'shop', label: 'Giảm 30K', code: 'S', amount: 30_000 },
    { voucherId: 'v2', scope: 'platform', label: 'Giảm 15% tối đa 50K', code: 'P', amount: 32_323 },
    { voucherId: 'v3', scope: 'shipping', label: 'Miễn phí vận chuyển tối đa 30K', code: 'F', amount: 22_000 },
  ],
  address: {} as Order['address'], shippingOption: 'fast', carrier: 'Chim Én Express', eta: [NOW + 3 * DAY, NOW + 5 * DAY], paymentMethod: 'vietqr',
  paymentStatus: 'paid', createdAt: NOW - 3 * DAY, at: {}, trackingCode: '',
}
const o = (p: Partial<Order>): Order => ({ ...base, ...p })

test('formats dates as dd/mm/yyyy hh:mm', () => {
  expect(dmyhm(NOW)).toBe('18/11/2026 14:05')
  expect(calendarDaysLeft(NOW + 2 * DAY, NOW)).toBe(2)
})

test('tabs: one status tab per order, counts from the whole list, unknown falls back to all', () => {
  const list = [o({ id: 'a', status: 'to_confirm' }), o({ id: 'b', status: 'to_ship' }), o({ id: 'c', status: 'completed' }), o({ id: 'd', status: 'return_requested' })]
  const c = tabCounts(list)
  expect(c).toMatchObject({ all: 4, to_ship: 2, delivered: 1, returns: 1, cancelled: 0 })
  expect(parseTab('nope')).toBe('all')
  expect(parseTab('returns')).toBe('returns')
  expect(ordersInTab([], 'all')).toEqual([])
  const sorted = ordersInTab([o({ id: 'x', createdAt: 1 }), o({ id: 'y', createdAt: 2 }), o({ id: 'w', createdAt: 2 })], 'all').map((x) => x.id)
  expect(sorted).toEqual(['w', 'y', 'x'])
})

test('card primary action follows the shared table', () => {
  expect(primaryAction(visibleActions(o({ status: 'awaiting_payment', paymentStatus: 'unpaid' }), NOW, true, false))).toBe('pay')
  expect(primaryAction(visibleActions(o({ status: 'to_confirm' }), NOW, false, false))).toBe('detail')
  expect(primaryAction(visibleActions(o({ status: 'delivered', at: { delivered: NOW - DAY } }), NOW, false, false))).toBe('confirm_received')
  const done = o({ status: 'completed', at: { delivered: NOW - 5 * DAY, completed: NOW - 3 * DAY } })
  expect(primaryAction(visibleActions(done, NOW, false, false))).toBe('review')
  const reviewed = { ...done, lines: done.lines.map((l) => ({ ...l, reviewId: 'r' })) }
  expect(primaryAction(visibleActions(reviewed, NOW, false, false))).toBe('buy_again')
  expect(visibleActions(o({ status: 'cancelled' }), NOW, false, true)).toEqual([])
  expect(primaryAction(visibleActions(o({ status: 'return_requested', returnId: 'R', at: { delivered: NOW - DAY } }), NOW, false, false))).toBe('view_return')
  expect(visibleActions(o({ status: 'shipping' }), NOW, false, false)).toEqual([])
})

test('status sentences', () => {
  expect(statusSentence(o({ status: 'delivered', at: { delivered: vnt(2026, 10, 18) } }))).toBe('Đơn hàng sẽ tự động hoàn thành vào 03/12/2026.')
  expect(statusSentence(o({ status: 'shipping' }))).toBe('Đơn hàng đang trên đường đến bạn.')
  expect(statusSentence(o({ status: 'to_ship' }))).toMatch(/^Shop đang chuẩn bị hàng. Dự kiến giao 21\/11 – 23\/11.$/)
  expect(statusSentence(o({ status: 'cancelled', cancelledBy: 'buyer', cancelReason: 'Tôi không có nhu cầu mua nữa' }))).toBe('Bạn đã hủy · Lý do: Tôi không có nhu cầu mua nữa')
  expect(whoCancelled(o({ cancelledBy: 'shop', cancelRequest: { status: 'accepted', reason: '', at: 0 } }), true)).toBe('Shop đã đồng ý hủy đơn')
  expect(whoCancelled(o({ cancelledBy: 'system' }))).toBe('Hệ thống đã hủy')
})

test('payment rows come from the snapshot, each voucher by name, and add up', () => {
  const { rows, consistent } = paymentRows(base)
  expect(rows.map((r) => r.label)).toEqual(['Tổng tiền hàng', 'Phí vận chuyển', 'Voucher của Shop · Giảm 30K', 'Voucher Market · Giảm 15% tối đa 50K', 'Voucher miễn phí vận chuyển'])
  expect(consistent).toBe(true)
  expect(paymentRows(o({ total: 1 })).consistent).toBe(false)
})

test('every seeded order snapshot adds up', () => {
  const w = seedWorld(NOW)
  for (const x of w.orders) expect(paymentRows(x).consistent).toBe(true)
})

test('cancel mode: immediate, one-shot request, withdraw, none', () => {
  expect(cancelMode(o({ status: 'awaiting_payment' }))).toBe('immediate')
  expect(cancelMode(o({ status: 'to_confirm' }))).toBe('immediate')
  expect(cancelMode(o({ status: 'to_ship' }))).toBe('request')
  expect(cancelMode(o({ status: 'to_ship', cancelRequest: { status: 'pending', reason: '', at: 0 } }))).toBe('withdraw')
  expect(cancelMode(o({ status: 'to_ship', cancelRequest: { status: 'refused', reason: '', at: 0 } }))).toBe('none')
  expect(cancelMode(o({ status: 'to_ship', cancelRequest: { status: 'withdrawn', reason: '', at: 0 } }))).toBe('none')
  expect(cancelMode(o({ status: 'shipping' }))).toBe('none')
})

test('refund copy by method and payment status', () => {
  expect(refundCopy('vietqr', 'paid')).toBe('Tiền sẽ được hoàn về tài khoản ngân hàng đã thanh toán trong vòng 24 giờ.')
  expect(refundCopy('card', 'paid')).toBe('Tiền sẽ được hoàn về thẻ đã thanh toán trong 7–14 ngày làm việc.')
  expect(refundCopy('cod', 'unpaid')).toBe('Đơn hàng thanh toán khi nhận hàng nên không có khoản nào cần hoàn.')
  expect(refundCopy('vietqr', 'unpaid')).toBe('Đơn hàng chưa được thanh toán nên không có khoản nào cần hoàn.')
  expect(refundInfo(o({ status: 'cancelled', paymentMethod: 'cod', paymentStatus: 'unpaid' })).kind).toBe('none_cod')
  expect(refundInfo(o({ refund: { amount: 415_677, to: 'Thẻ đã thanh toán', status: 'done', at: NOW, doneAt: NOW + DAY } })).text).toBe('Đã hoàn tiền · 415.677₫ · 19/11/2026')
})

test('orders sharing one unpaid payment cancel together', () => {
  const a = o({ id: 'a', status: 'awaiting_payment' }), b = o({ id: 'b', status: 'awaiting_payment' }), c = o({ id: 'c', paymentId: 'P2', status: 'awaiting_payment' })
  expect(ordersSharingPayment(a, [a, b, c]).map((x) => x.id)).toEqual(['a', 'b'])
  expect(ordersSharingPayment(o({ status: 'to_confirm' }), [a, b])).toHaveLength(1)
})

test('countdown', () => {
  expect(timeLeft(NOW + 754_000, NOW)).toEqual({ mm: '12', ss: '34', expired: false, soon: false })
  expect(timeLeft(NOW + 40_000, NOW).soon).toBe(true)
  expect(timeLeft(NOW - 1, NOW).expired).toBe(true)
})

test('buy again toast gives counts, never names', () => {
  expect(buyAgainToast(2, 1)).toBe('Đã thêm 2 sản phẩm vào giỏ. 1 sản phẩm đã hết hàng hoặc không còn bán.')
  expect(buyAgainToast(3, 0)).toBe('Đã thêm 3 sản phẩm vào giỏ.')
  expect(buyAgainToast(0, 2)).toBe('Các sản phẩm trong đơn này hiện không còn bán.')
})

test('invoice and return entry', () => {
  expect(invoiceAvailable(o({ status: 'awaiting_payment' }))).toBe(false)
  expect(invoiceAvailable(o({ status: 'cancelled' }))).toBe(false)
  expect(invoiceAvailable(o({ status: 'shipping' }))).toBe(true)
  const d = o({ status: 'delivered', at: { delivered: NOW - 3 * DAY } })
  expect(canRequestReturn(d, NOW)).toMatchObject({ ok: true })
  expect(canRequestReturn(d, NOW + 13 * DAY).ok).toBe(false)
  expect(canRequestReturn({ ...d, returnId: 'R' }, NOW).ok).toBe(false)
  expect(dmy(canRequestReturn(d, NOW).deadline!)).toBe('30/11/2026')
})

test('review prompt and banner copy', () => {
  const done = o({ status: 'completed', at: { delivered: NOW - 5 * DAY, completed: NOW - 3 * DAY } })
  const p = reviewPrompt(done, NOW)
  expect(p.kind).toBe('open')
  expect(reviewBannerText(p)).toBe(`Đánh giá sản phẩm trước ${dmy(NOW + 27 * DAY)}`)
  expect(reviewBannerText(reviewPrompt(done, NOW + 25 * DAY))).toBe('Còn 2 ngày để đánh giá')
  expect(reviewBannerText(reviewPrompt(done, NOW + 27 * DAY - 60_000))).toBe('Hôm nay là ngày cuối để đánh giá')
  expect(reviewPrompt(done, NOW + 28 * DAY).kind).toBe('expired')
  const half = { ...done, lines: [{ ...done.lines[0], reviewId: 'r' }, done.lines[1]] }
  expect(reviewBannerText(reviewPrompt(half, NOW))).toBe('Đã đánh giá 1/2 sản phẩm')
  expect(reviewPrompt(o({ status: 'shipping' }), NOW).kind).toBe('none')
  // An open return keeps the window of the status before it.
  const ret = o({ status: 'return_requested', statusBeforeReturn: 'delivered', returnId: 'R', at: { delivered: NOW - DAY } })
  expect(reviewPrompt(ret, NOW).kind).toBe('open')
})

test('tracking events newest first, per order', () => {
  const ev = orderEvents([{ orderId: 'a', at: 1, code: '', text: 'x' }, { orderId: 'b', at: 3, code: '', text: 'y' }, { orderId: 'a', at: 2, code: '', text: 'z' }], 'a')
  expect(ev.map((e) => e.text)).toEqual(['z', 'x'])
})

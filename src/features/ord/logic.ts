// Pure order-view helpers: US-ORD-001..007, US-REV-002. Rules live in @/domain/orders; this file only turns them into screen copy.
import { allowedActions, AUTO_COMPLETE_DAYS, returnWindowEnds, reviewWindowEnds, tabOf, type OrderAction, type OrderTab } from '@/domain/orders'
import { OPTION_LABEL } from '@/domain/shipping'
import type { Order, PaymentMethod, ReturnRequest, TrackingEvent } from '@/domain/types'

export const DAY = 86_400_000
import { dm, dmy, hm, vnStartOfDay as startOfDay } from '@/domain/time'
export { dm, dmy, hm }
export const dmyhm = (t: number) => `${dmy(t)} ${hm(t)}`
const pad = (n: number) => String(n).padStart(2, '0')
/** Calendar days from today to `until` (0 = today is the last day, negative = passed). */
export const calendarDaysLeft = (until: number, now: number) => Math.round((startOfDay(until) - startOfDay(now)) / DAY)

/* ── List (US-ORD-001) ─────────────────────────────────────────────── */

export const TABS: { id: OrderTab; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'awaiting_payment', label: 'Chờ thanh toán' },
  { id: 'to_ship', label: 'Chờ lấy hàng' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'delivered', label: 'Đã giao' },
  { id: 'cancelled', label: 'Đã hủy' },
  { id: 'returns', label: 'Trả hàng/Hoàn tiền' },
]
/** Tabs that show a count: things still in progress. */
export const COUNTED: OrderTab[] = ['awaiting_payment', 'to_ship', 'shipping', 'returns']
export const parseTab = (v: string | null): OrderTab => (TABS.some((t) => t.id === v) ? (v as OrderTab) : 'all')

export function tabCounts(orders: Order[]): Record<OrderTab, number> {
  const c = Object.fromEntries(TABS.map((t) => [t.id, 0])) as Record<OrderTab, number>
  for (const o of orders) { c.all += 1; c[tabOf(o)] += 1 }
  return c
}
/** Newest first, ties by id; history is never truncated. */
export const ordersInTab = (orders: Order[], tab: OrderTab) =>
  orders.filter((o) => tab === 'all' || tabOf(o) === tab).sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? -1 : 1))

/* ── Actions ───────────────────────────────────────────────────────── */

export const ACTION_LABEL: Record<OrderAction, string> = {
  pay: 'Thanh toán ngay', cancel: 'Hủy đơn hàng', request_cancel: 'Gửi yêu cầu hủy', withdraw_cancel: 'Rút yêu cầu hủy',
  confirm_received: 'Đã nhận được hàng', return: 'Trả hàng/Hoàn tiền', review: 'Đánh giá', buy_again: 'Mua lại',
  invoice: 'Tải hóa đơn', view_return: 'Xem chi tiết trả hàng',
}
/** Action-bar actions: the shared table minus the invoice (it sits in the details block) and "Mua lại" when nothing is still sold. */
export const visibleActions = (o: Order, now: number, payOpen: boolean, allDelisted: boolean) =>
  allowedActions(o, now, payOpen).filter((a) => a !== 'invoice' && !(a === 'buy_again' && allDelisted))

export type CardAction = 'pay' | 'confirm_received' | 'review' | 'buy_again' | 'view_return' | 'detail'
const CARD_ACTIONS: CardAction[] = ['pay', 'confirm_received', 'review', 'buy_again', 'view_return']
/** At most one action on a card; everything else reads "Xem chi tiết". */
export const primaryAction = (actions: OrderAction[]): CardAction =>
  (actions.find((a) => (CARD_ACTIONS as string[]).includes(a)) as CardAction | undefined) ?? 'detail'

/* ── Status copy (US-ORD-002, -003, -004) ──────────────────────────── */

export const autoCompleteAt = (o: Order) => (o.at.delivered ? o.at.delivered + AUTO_COMPLETE_DAYS * DAY : undefined)

export function whoCancelled(o: Order, detail = false) {
  if (o.cancelledBy === 'shop') return detail && o.cancelRequest?.status === 'accepted' ? 'Shop đã đồng ý hủy đơn' : 'Shop đã hủy'
  if (o.cancelledBy === 'system') return 'Hệ thống đã hủy'
  return 'Bạn đã hủy'
}

/** One plain sentence for the status block. `ret` is the order's return request, if any. */
export function statusSentence(o: Order, ret?: ReturnRequest): string {
  switch (o.status) {
    case 'awaiting_payment': return 'Hoàn tất thanh toán để Shop bắt đầu chuẩn bị hàng.'
    case 'to_confirm': return 'Đang chờ Shop xác nhận đơn hàng.'
    case 'to_ship': return `Shop đang chuẩn bị hàng. Dự kiến giao ${dm(o.eta[0])} – ${dm(o.eta[1])}.`
    case 'shipping': return 'Đơn hàng đang trên đường đến bạn.'
    case 'delivered': return `Đơn hàng sẽ tự động hoàn thành vào ${dmy(autoCompleteAt(o) ?? o.createdAt)}.`
    case 'completed': return o.at.completed ? `Đơn hàng đã hoàn thành ngày ${dmy(o.at.completed)}.` : 'Đơn hàng đã hoàn thành.'
    case 'cancelled': return `${whoCancelled(o, true)}${o.cancelReason ? ` · Lý do: ${o.cancelReason}` : ''}`
    case 'return_requested': return ret ? `Yêu cầu trả hàng/hoàn tiền: ${RETURN_SHORT[ret.status]}.` : 'Đơn hàng có yêu cầu trả hàng/hoàn tiền.'
    case 'returned': return 'Yêu cầu trả hàng/hoàn tiền đã được hoàn tiền.'
  }
}
const RETURN_SHORT: Record<ReturnRequest['status'], string> = {
  submitted: 'đã gửi, chờ Market xem xét', under_review: 'Market đang xem xét', needs_evidence: 'cần bổ sung bằng chứng',
  awaiting_return_shipment: 'chờ bạn gửi hàng trả', returning: 'hàng trả đang trên đường', inspecting: 'đang kiểm tra hàng trả',
  refunded: 'đã hoàn tiền', rejected: 'không được chấp nhận',
}

export function cancelRequestBanner(o: Order): string | undefined {
  if (o.status === 'cancelled' || !o.cancelRequest) return undefined
  return { pending: 'Đã gửi yêu cầu hủy. Đang chờ Shop phản hồi.', refused: 'Shop đã từ chối yêu cầu hủy. Đơn hàng sẽ tiếp tục được giao.', withdrawn: 'Bạn đã rút yêu cầu hủy.', accepted: undefined }[o.cancelRequest.status]
}

export const carrierLine = (o: Order) => `${OPTION_LABEL[o.shippingOption]} · ${o.carrier}`

/** Tracking events of one order, newest first. */
export const orderEvents = (all: TrackingEvent[], orderId: string) => all.filter((e) => e.orderId === orderId).sort((a, b) => b.at - a.at)

/* ── Money (snapshot only, never recalculated) ─────────────────────── */

const SCOPE_PREFIX = { shop: 'Voucher của Shop', platform: 'Voucher Market', shipping: 'Voucher miễn phí vận chuyển' } as const
export type MoneyRow = { label: string; amount: number; minus?: boolean }
/** "Chi tiết thanh toán" rows from the order snapshot, each voucher by name; `consistent` is the goods + shipping − vouchers = total check. */
export function paymentRows(o: Order): { rows: MoneyRow[]; consistent: boolean } {
  const rows: MoneyRow[] = [{ label: 'Tổng tiền hàng', amount: o.goods }, { label: 'Phí vận chuyển', amount: o.shippingFee }]
  for (const v of o.vouchers) rows.push({ label: v.scope === 'shipping' ? SCOPE_PREFIX.shipping : `${SCOPE_PREFIX[v.scope]} · ${v.label}`, amount: v.amount, minus: true })
  const consistent = o.goods + o.shippingFee - o.vouchers.reduce((a, v) => a + v.amount, 0) === o.total
  return { rows, consistent }
}

/* ── Cancel (US-ORD-003) ───────────────────────────────────────────── */

export type CancelMode = 'immediate' | 'request' | 'withdraw' | 'none'
export function cancelMode(o: Order): CancelMode {
  if (o.status === 'awaiting_payment' || o.status === 'to_confirm') return 'immediate'
  if (o.status === 'to_ship') return !o.cancelRequest ? 'request' : o.cancelRequest.status === 'pending' ? 'withdraw' : 'none'
  return 'none'
}
export const CANCEL_REASONS = [
  'Tôi muốn cập nhật địa chỉ/số điện thoại nhận hàng',
  'Tôi muốn thay đổi sản phẩm (phân loại, số lượng…)',
  'Thủ tục thanh toán quá rắc rối',
  'Tôi tìm thấy chỗ mua khác tốt hơn',
  'Tôi không có nhu cầu mua nữa',
  'Lý do khác',
]
/** The refund sentence shown before the buyer confirms a cancel (rules.md#order-rules). */
export function refundCopy(method: PaymentMethod, paymentStatus: Order['paymentStatus']): string {
  if (paymentStatus !== 'paid') return method === 'cod' ? 'Đơn hàng thanh toán khi nhận hàng nên không có khoản nào cần hoàn.' : 'Đơn hàng chưa được thanh toán nên không có khoản nào cần hoàn.'
  switch (method) {
    case 'vietqr': return 'Tiền sẽ được hoàn về tài khoản ngân hàng đã thanh toán trong vòng 24 giờ.'
    case 'wallet': return 'Tiền sẽ được hoàn về ví điện tử đã thanh toán trong vòng 24 giờ.'
    case 'card': return 'Tiền sẽ được hoàn về thẻ đã thanh toán trong 7–14 ngày làm việc.'
    case 'cod': return 'Tiền sẽ được hoàn về tài khoản ngân hàng ••••6789 trong vòng 24 giờ.'
  }
}
/** Orders cancelled together with `o`: one unpaid Payment covers the whole checkout. */
export const ordersSharingPayment = (o: Order, orders: Order[]) =>
  o.status === 'awaiting_payment' ? orders.filter((x) => x.paymentId === o.paymentId && x.status === 'awaiting_payment') : [o]

/** Refund row on a cancelled order. */
export function refundInfo(o: Order): { kind: 'none_cod' | 'none_unpaid' | 'pending' | 'refunded'; text: string } {
  if (o.refund?.status === 'done') return { kind: 'refunded', text: `Đã hoàn tiền · ${fmt(o.refund.amount)} · ${dmy(o.refund.doneAt ?? o.refund.at)}` }
  if (o.refund) return { kind: 'pending', text: `Đang hoàn tiền · ${fmt(o.refund.amount)} về ${o.refund.to.toLowerCase()} · ${o.paymentMethod === 'card' ? '7–14 ngày làm việc' : 'trong vòng 24 giờ'}` }
  if (o.paymentMethod === 'cod') return { kind: 'none_cod', text: 'Đơn hàng thanh toán khi nhận hàng nên không có khoản nào cần hoàn.' }
  return { kind: 'none_unpaid', text: 'Đơn hàng chưa được thanh toán nên không có khoản nào cần hoàn.' }
}
const fmt = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₫`

/* ── Payment countdown (US-ORD-005) ────────────────────────────────── */

export function timeLeft(expiresAt: number, now: number) {
  const s = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  return { mm: pad(Math.floor(s / 60)), ss: pad(s % 60), expired: s === 0, soon: s > 0 && s < 60 }
}

/* ── Buy again (US-ORD-006) ────────────────────────────────────────── */

export function buyAgainToast(added: number, skipped: number): string {
  if (!added) return 'Các sản phẩm trong đơn này hiện không còn bán.'
  return `Đã thêm ${added} sản phẩm vào giỏ.${skipped ? ` ${skipped} sản phẩm đã hết hàng hoặc không còn bán.` : ''}`
}

/* ── Invoice and return entry ──────────────────────────────────────── */

export const invoiceAvailable = (o: Order) => o.status !== 'awaiting_payment' && o.status !== 'cancelled'

export function canRequestReturn(o: Order, now: number): { ok: boolean; deadline?: number } {
  const deadline = returnWindowEnds(o)
  return { ok: (o.status === 'delivered' || o.status === 'completed') && !o.returnId && !!deadline && now < deadline, deadline }
}

/* ── Review prompt (US-REV-002) ────────────────────────────────────── */

export type ReviewPrompt = { kind: 'none' | 'open' | 'partial' | 'done' | 'expired'; until?: number; daysLeft: number; reviewed: number; total: number }
export function reviewPrompt(o: Order, now: number): ReviewPrompt {
  const total = o.lines.length
  const reviewed = o.lines.filter((l) => l.reviewId).length
  const until = reviewWindowEnds(o)
  const base = { until, reviewed, total, daysLeft: until ? calendarDaysLeft(until, now) : -1 }
  if (!['delivered', 'completed', 'return_requested', 'returned'].includes(o.status) || !o.at.delivered) return { kind: 'none', ...base }
  if (reviewed === total) return { kind: 'done', ...base }
  if (!until || now >= until) return { kind: 'expired', ...base }
  return { kind: reviewed ? 'partial' : 'open', ...base }
}
export function reviewBannerText(p: ReviewPrompt): string {
  if (p.kind === 'partial') return `Đã đánh giá ${p.reviewed}/${p.total} sản phẩm`
  if (p.kind === 'expired') return `Đã hết hạn đánh giá (${dmy(p.until ?? 0)}).`
  if (p.daysLeft <= 0) return 'Hôm nay là ngày cuối để đánh giá'
  if (p.daysLeft <= 2) return `Còn ${p.daysLeft} ngày để đánh giá`
  return `Đánh giá sản phẩm trước ${dmy(p.until ?? 0)}`
}

// Order rules: spec/ia/rules.md#order-rules, #returns, #reviews and the story-writing decisions.
import { allocate } from './pricing'
import type { Order, OrderStatus, PaymentMethod, ReturnStatus } from './types'

const DAY = 86_400_000
export const RETURN_WINDOW_DAYS = 15
export const AUTO_COMPLETE_DAYS = 15
export const REVIEW_DAYS_AFTER_COMPLETE = 30
export const RETURN_SHIP_DAYS = 6
export const PAYMENT_MINUTES = 15
export const COD_CAP = 10_000_000

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Chờ thanh toán',
  to_confirm: 'Chờ xác nhận',
  to_ship: 'Chờ lấy hàng',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  return_requested: 'Trả hàng/Hoàn tiền',
  returned: 'Đã trả hàng',
}

export const RETURN_LABEL: Record<ReturnStatus, string> = {
  submitted: 'Đã gửi yêu cầu',
  under_review: 'Market đang xem xét',
  needs_evidence: 'Cần bổ sung bằng chứng',
  awaiting_return_shipment: 'Chờ gửi hàng trả',
  returning: 'Đang trả hàng',
  inspecting: 'Đang kiểm tra',
  refunded: 'Đã hoàn tiền',
  rejected: 'Từ chối',
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng',
  vietqr: 'Chuyển khoản ngân hàng (VietQR)',
  wallet: 'Ví điện tử',
  card: 'Thẻ tín dụng/ghi nợ',
}

/** Orders-list tab for an order: rules.md#decisions-from-story-writing (Orders tabs). */
export type OrderTab = 'all' | 'awaiting_payment' | 'to_ship' | 'shipping' | 'delivered' | 'cancelled' | 'returns'
export function tabOf(o: Order): Exclude<OrderTab, 'all'> {
  switch (o.status) {
    case 'awaiting_payment': return 'awaiting_payment'
    case 'to_confirm': case 'to_ship': return 'to_ship'
    case 'shipping': return 'shipping'
    case 'delivered': case 'completed': return 'delivered'
    case 'cancelled': return 'cancelled'
    case 'return_requested': case 'returned': return 'returns'
  }
}

export type OrderAction = 'pay' | 'cancel' | 'request_cancel' | 'withdraw_cancel' | 'confirm_received' | 'return' | 'review' | 'buy_again' | 'invoice' | 'view_return'

export function returnWindowEnds(o: Order) {
  return o.at.delivered ? o.at.delivered + RETURN_WINDOW_DAYS * DAY : undefined
}
export function reviewWindowEnds(o: Order) {
  // A return keeps the window of the status before it (rules.md#reviews).
  const s = o.status === 'return_requested' || o.status === 'returned' ? o.statusBeforeReturn : o.status
  if (s === 'delivered') return o.at.delivered ? o.at.delivered + (AUTO_COMPLETE_DAYS + REVIEW_DAYS_AFTER_COMPLETE) * DAY : undefined
  return o.at.completed ? o.at.completed + REVIEW_DAYS_AFTER_COMPLETE * DAY : undefined
}
export const canReview = (o: Order, now: number) =>
  (o.status === 'delivered' || o.status === 'completed' || ((o.status === 'return_requested' || o.status === 'returned') && !!o.at.delivered)) &&
  (reviewWindowEnds(o) ?? 0) > now &&
  o.lines.some((l) => !l.reviewId)

/** Every action the buyer may take now, in display priority (first = primary). */
export function allowedActions(o: Order, now: number, paymentOpen: boolean): OrderAction[] {
  const a: OrderAction[] = []
  switch (o.status) {
    case 'awaiting_payment':
      if (paymentOpen) a.push('pay')
      a.push('cancel')
      break
    case 'to_confirm':
      a.push('cancel')
      break
    case 'to_ship':
      if (!o.cancelRequest) a.push('request_cancel')
      else if (o.cancelRequest.status === 'pending') a.push('withdraw_cancel')
      break
    case 'delivered':
      a.push('confirm_received')
      if ((returnWindowEnds(o) ?? 0) > now && !o.returnId) a.push('return')
      if (canReview(o, now)) a.push('review')
      break
    case 'completed':
      if (canReview(o, now)) a.push('review')
      if ((returnWindowEnds(o) ?? 0) > now && !o.returnId) a.push('return')
      a.push('buy_again')
      break
    case 'cancelled':
      a.push('buy_again')
      break
    case 'return_requested': case 'returned':
      a.push('view_return')
      if (canReview(o, now)) a.push('review')
      a.push('buy_again')
      break
  }
  if (o.status !== 'awaiting_payment' && o.status !== 'cancelled') a.push('invoice')
  return a
}

/** Where a refund goes, by the paid method: rules.md#order-rules. COD has nothing to refund unless it was delivered and paid. */
export function refundDestination(method: PaymentMethod, paid: boolean): { to: string; eta: string } | null {
  if (!paid) return null
  switch (method) {
    case 'vietqr': return { to: 'Tài khoản ngân hàng đã chuyển khoản', eta: 'trong 24 giờ' }
    case 'wallet': return { to: 'Ví điện tử đã thanh toán', eta: 'trong 24 giờ' }
    case 'card': return { to: 'Thẻ đã thanh toán', eta: '7–14 ngày làm việc' }
    case 'cod': return { to: 'Tài khoản ngân hàng ••••6789', eta: '2 ngày làm việc' }
  }
}

export type RefundSplit = { goods: number; shopShare: number; platformShare: number; cash: number; voucherCredit: number; shipping: number }

/**
 * What a return of `lineIds` gives back: rules.md#returns and the story-writing decisions.
 * Order-level discounts are split across lines pro rata to line goods (largest remainder).
 * Cash = line goods − shop share − platform share; the platform share returns as a Voucher Market credit;
 * shop and shipping vouchers are not returned; shipping paid is refunded only when every line is returned.
 */
export function refundSplit(o: Order, lineIds: string[]): RefundSplit {
  const goodsByLine = o.lines.map((l) => l.unitPrice * l.qty)
  const shop = allocate(o.shopDiscount, goodsByLine)
  const plat = allocate(o.platformDiscount, goodsByLine)
  let goods = 0, shopShare = 0, platformShare = 0
  o.lines.forEach((l, i) => {
    if (!lineIds.includes(l.id)) return
    goods += goodsByLine[i]; shopShare += shop[i]; platformShare += plat[i]
  })
  const all = o.lines.every((l) => lineIds.includes(l.id))
  const shipping = all ? o.shippingFee - o.shippingDiscount : 0
  return { goods, shopShare, platformShare, cash: goods - shopShare - platformShare + shipping, voucherCredit: platformShare, shipping }
}

export const REVIEW_TAGS = ['Chất lượng tốt', 'Đúng mô tả', 'Đóng gói cẩn thận', 'Giao hàng nhanh', 'Shop tư vấn nhiệt tình', 'Đáng tiền']

export const CANCEL_REASONS = [
  'Muốn thay đổi địa chỉ giao hàng',
  'Muốn thay đổi phân loại hoặc số lượng',
  'Muốn nhập hoặc đổi voucher',
  'Tìm thấy giá rẻ hơn ở chỗ khác',
  'Đổi ý, không muốn mua nữa',
  'Lý do khác',
]

export const RETURN_REASONS: { id: import('./types').ReturnReason; label: string; needsPhotos: boolean }[] = [
  { id: 'not_received', label: 'Chưa nhận được hàng', needsPhotos: false },
  { id: 'missing', label: 'Thiếu hàng', needsPhotos: true },
  { id: 'wrong_item', label: 'Giao sai hàng', needsPhotos: true },
  { id: 'damaged', label: 'Hàng bể vỡ, lỗi', needsPhotos: true },
  { id: 'not_as_described', label: 'Khác mô tả', needsPhotos: true },
  { id: 'counterfeit', label: 'Hàng giả', needsPhotos: true },
  { id: 'changed_mind', label: 'Đổi ý (còn nguyên tem nhãn và bao bì)', needsPhotos: true },
]

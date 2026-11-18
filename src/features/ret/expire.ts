// US-RET-002: a missed return-shipping deadline ends as "Từ chối" (rules.md#decisions-from-story-writing). The store's syncTime does not cover it.
import { getState, mutate, now } from '@/app/store'

export function expireReturnDeadlines() {
  const t = now()
  const due = (r: { status: string; returnDeadline?: number }) => r.status === 'awaiting_return_shipment' && !!r.returnDeadline && r.returnDeadline <= t
  if (!getState().world.returns.some(due)) return
  mutate((w) => {
    for (const r of w.returns.filter(due)) {
      r.status = 'rejected'; r.rejectReason = 'Quá hạn gửi hàng trả'
      r.timeline.push({ status: 'rejected', at: t, note: 'Quá hạn gửi hàng trả' })
      const o = w.orders.find((x) => x.id === r.orderId)
      if (o) o.status = o.statusBeforeReturn ?? 'completed'
    }
  })
}

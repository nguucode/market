import { refundSplit } from '@/domain/orders'
import type { Order, ReturnRequest } from '@/domain/types'
import { activeSteps, allowedSolutions, deadlineCopy, emptyDraft, nextStep, prevStep, resolveStep, returnTimeline, stepError, validPhoto, validTrackingCode, type Draft } from './logic'

const DAY = 86_400_000
/** 10:00 on 18/11/2026 in Vietnam (UTC+7), so the test passes in any runner timezone. */
const NOW = Date.UTC(2026, 10, 18, 3, 0)

test('step guard sends the buyer back to the first incomplete step', () => {
  const d = emptyDraft()
  expect(resolveStep('confirm', d)).toBe('items')
  expect(resolveStep(null, d)).toBe('items')
  expect(resolveStep('bogus', d)).toBe('items')
  const withItems: Draft = { ...d, lineIds: ['l1'] }
  expect(resolveStep('evidence', withItems)).toBe('reason')
  const damaged: Draft = { ...withItems, reason: 'damaged' }
  expect(resolveStep('refund', damaged)).toBe('evidence')
  expect(stepError('evidence', damaged)).toBe('Vui lòng thêm ít nhất 1 ảnh.')
  const full: Draft = { ...damaged, photos: ['p'], solution: 'return_and_refund' }
  expect(resolveStep('confirm', full)).toBe('confirm')
  expect(resolveStep('result', full)).toBe('confirm')
  expect(resolveStep('result', { ...full, submittedId: 'RT1' })).toBe('result')
})

test('"Chưa nhận được hàng" skips evidence and only refunds', () => {
  const d: Draft = { ...emptyDraft(['l1']), reason: 'not_received' }
  expect(activeSteps(d)).toEqual(['items', 'reason', 'refund', 'confirm'])
  expect(nextStep('reason', d)).toBe('refund')
  expect(prevStep('refund', d)).toBe('reason')
  expect(resolveStep('evidence', d)).toBe('refund')
  expect(allowedSolutions('not_received')).toEqual(['refund_only'])
  expect(stepError('refund', { ...d, solution: 'return_and_refund' })).not.toBeNull()
})

test('"Đổi ý" needs the intact-packaging tick', () => {
  const d: Draft = { ...emptyDraft(['l1']), reason: 'changed_mind' }
  expect(stepError('reason', d)).not.toBeNull()
  expect(stepError('reason', { ...d, intact: true })).toBeNull()
  expect(stepError('reason', { ...d, intact: true, description: 'x'.repeat(501) })).not.toBeNull()
})

test('refund split for the Shop A worked example', () => {
  const o = {
    lines: [{ id: 'a', unitPrice: 149_000, qty: 2 }, { id: 'b', unitPrice: 180_000, qty: 1 }],
    shopDiscount: 30_000, platformDiscount: 32_323, shippingFee: 22_000, shippingDiscount: 22_000, total: 415_677,
  } as unknown as Order
  expect(refundSplit(o, ['b'])).toMatchObject({ shopShare: 11_297, platformShare: 12_172, cash: 156_531, voucherCredit: 12_172 })
  expect(refundSplit(o, ['a', 'b']).cash + refundSplit(o, ['a', 'b']).voucherCredit).toBe(415_677 + 32_323)
})

test('photo validation', () => {
  expect(validPhoto({ type: 'image/jpeg', name: 'a.jpg', size: 1000 })).toBe(true)
  expect(validPhoto({ type: '', name: 'IMG_1.HEIC', size: 1000 })).toBe(true)
  expect(validPhoto({ type: 'application/pdf', name: 'a.pdf', size: 1000 })).toBe(false)
  expect(validPhoto({ type: 'image/png', name: 'a.png', size: 11 * 1024 * 1024 })).toBe(false)
})

const req = (p: Partial<ReturnRequest>): ReturnRequest => ({
  id: 'RT1', orderId: 'o', lineIds: [], reason: 'damaged', description: '', photos: [], solution: 'return_and_refund', refundTo: '', cash: 0, voucherCredit: 0, shippingRefund: 0,
  status: 'under_review', createdAt: 0, timeline: [{ status: 'submitted', at: 1 }, { status: 'under_review', at: 2 }], ...p,
})

test('return timeline: reached newest first, pending in order, refund-only skips shipping', () => {
  const t = returnTimeline(req({}))
  expect(t.reached.map((x) => x.status)).toEqual(['under_review', 'submitted'])
  expect(t.pending).toEqual(['awaiting_return_shipment', 'returning', 'inspecting', 'refunded'])
  expect(returnTimeline(req({ solution: 'refund_only' })).pending).toEqual(['refunded'])
  const ev = req({ status: 'needs_evidence', timeline: [{ status: 'submitted', at: 1 }, { status: 'under_review', at: 2 }, { status: 'needs_evidence', at: 3 }] })
  expect(returnTimeline(ev).reached[0].status).toBe('needs_evidence')
  expect(returnTimeline(ev).pending[0]).toBe('awaiting_return_shipment')
  expect(returnTimeline(req({ status: 'rejected' })).pending).toEqual([])
})

test('deadline copy', () => {
  expect(deadlineCopy(NOW + 6 * DAY, NOW).text).toBe('Gửi hàng trước 24/11/2026 · còn 6 ngày')
  expect(deadlineCopy(NOW + 6 * DAY, NOW).urgent).toBe(false)
  expect(deadlineCopy(NOW + 1 * DAY, NOW).urgent).toBe(true)
  expect(deadlineCopy(NOW + 2 * 3_600_000, NOW).text).toBe('Hạn gửi hàng hôm nay')
  expect(deadlineCopy(NOW - 1, NOW).kind).toBe('expired')
})

test('tracking code: 8–20 letters or digits', () => {
  expect(validTrackingCode('CE12345678VN')).toBe(true)
  expect(validTrackingCode('abc')).toBe(false)
  expect(validTrackingCode('CE-1234567')).toBe(false)
})

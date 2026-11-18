// Pure return helpers: US-RET-001 (flow steps), US-RET-002 (status page). Money split lives in @/domain/orders#refundSplit.
import type { PaymentMethod, ReturnReason, ReturnRequest, ReturnStatus } from '@/domain/types'
import { calendarDaysLeft, dmy } from '@/features/ord/logic'

export const REASONS: { id: ReturnReason; label: string }[] = [
  { id: 'not_received', label: 'Chưa nhận được hàng' },
  { id: 'missing', label: 'Thiếu hàng' },
  { id: 'wrong_item', label: 'Giao sai hàng' },
  { id: 'damaged', label: 'Hàng bể vỡ, lỗi' },
  { id: 'not_as_described', label: 'Khác mô tả' },
  { id: 'counterfeit', label: 'Hàng giả' },
  { id: 'changed_mind', label: 'Đổi ý' },
]
export const reasonLabel = (r: ReturnReason) => REASONS.find((x) => x.id === r)!.label

export type Solution = ReturnRequest['solution']
export const SOLUTION: Record<Solution, { title: string; body: string }> = {
  refund_only: { title: 'Hoàn tiền ngay', body: 'Không cần gửi trả hàng' },
  return_and_refund: { title: 'Trả hàng và hoàn tiền', body: 'Bạn gửi trả hàng trong 6 ngày sau khi được chấp nhận' },
}
export const evidenceRequired = (r?: ReturnReason) => r !== 'not_received'
export const allowedSolutions = (r?: ReturnReason): Solution[] => (r === 'not_received' ? ['refund_only'] : ['refund_only', 'return_and_refund'])

export function returnDestinationCopy(m: PaymentMethod) {
  if (m === 'card') return 'Thẻ đã thanh toán · 7–14 ngày làm việc'
  if (m === 'cod') return 'Tài khoản ngân hàng ••••6789 · trong vòng 24 giờ'
  return 'Nguồn thanh toán ban đầu · trong vòng 24 giờ sau khi hoàn tiền'
}

/* ── Flow steps ────────────────────────────────────────────────────── */

export const STEPS = ['items', 'reason', 'evidence', 'refund', 'confirm'] as const
export type Step = (typeof STEPS)[number] | 'result'
export const STEP_LABEL: Record<(typeof STEPS)[number], string> = { items: 'Sản phẩm', reason: 'Lý do', evidence: 'Bằng chứng', refund: 'Hoàn tiền', confirm: 'Xác nhận' }

export type Draft = { lineIds: string[]; reason?: ReturnReason; description: string; intact: boolean; photos: string[]; solution?: Solution; submittedId?: string }
export const emptyDraft = (lineIds: string[] = []): Draft => ({ lineIds, description: '', intact: false, photos: [] })

export const DESCRIPTION_MAX = 500
export const MAX_PHOTOS = 5

/** Why a step cannot be left yet, or null when it is complete. */
export function stepError(step: (typeof STEPS)[number], d: Draft): string | null {
  switch (step) {
    case 'items': return d.lineIds.length ? null : 'Chọn ít nhất 1 sản phẩm.'
    case 'reason':
      if (!d.reason) return 'Chọn lý do trả hàng.'
      if (d.reason === 'changed_mind' && !d.intact) return 'Xác nhận sản phẩm còn nguyên tem, nhãn và bao bì.'
      return d.description.length > DESCRIPTION_MAX ? `Mô tả tối đa ${DESCRIPTION_MAX} ký tự.` : null
    case 'evidence': return !evidenceRequired(d.reason) || d.photos.length ? null : 'Vui lòng thêm ít nhất 1 ảnh.'
    case 'refund': return d.solution && allowedSolutions(d.reason).includes(d.solution) ? null : 'Chọn cách hoàn tiền.'
    case 'confirm': return null
  }
}
/** The steps this draft walks through: evidence drops out for "Chưa nhận được hàng". */
export const activeSteps = (d: Draft) => STEPS.filter((s) => s !== 'evidence' || evidenceRequired(d.reason))

/** Guard for `?step=`: the requested step, or the first earlier step that is still incomplete. */
export function resolveStep(requested: string | null, d: Draft): Step {
  if (requested === 'result') return d.submittedId ? 'result' : resolveStep('confirm', d)
  const steps = activeSteps(d)
  const target = steps.includes(requested as never) ? (requested as (typeof STEPS)[number]) : requested === 'evidence' ? 'refund' : 'items'
  for (const s of steps) {
    if (s === target) return s
    if (stepError(s, d)) return s
  }
  return target
}
export const nextStep = (s: Step, d: Draft): Step => {
  const steps = activeSteps(d)
  const i = steps.indexOf(s as never)
  return i < 0 || i === steps.length - 1 ? 'result' : steps[i + 1]
}
export const prevStep = (s: Step, d: Draft): Step | null => {
  const steps = activeSteps(d)
  const i = steps.indexOf(s as never)
  return i > 0 ? steps[i - 1] : null
}

/* ── Photos ────────────────────────────────────────────────────────── */

export const PHOTO_ERROR = 'Ảnh không hợp lệ (tối đa 10 MB, định dạng JPG, PNG, HEIC).'
export const validPhoto = (f: { type: string; name: string; size: number }) =>
  f.size <= 10 * 1024 * 1024 && (/^image\/(jpeg|png|heic|heif|webp)$/.test(f.type) || /\.(jpe?g|png|heic|heif)$/i.test(f.name))

/* ── Status page (US-RET-002) ──────────────────────────────────────── */

const PATH: Record<Solution, ReturnStatus[]> = {
  refund_only: ['submitted', 'under_review', 'refunded'],
  return_and_refund: ['submitted', 'under_review', 'awaiting_return_shipment', 'returning', 'inspecting', 'refunded'],
}
/** Reached entries newest first, and the steps still ahead in order (none after a final status). */
export function returnTimeline(r: ReturnRequest): { reached: ReturnRequest['timeline']; pending: ReturnStatus[] } {
  const reached = [...r.timeline].sort((a, b) => b.at - a.at)
  if (r.status === 'refunded' || r.status === 'rejected') return { reached, pending: [] }
  const path = PATH[r.solution]
  const current = r.status === 'needs_evidence' ? 'under_review' : r.status
  return { reached, pending: path.slice(path.indexOf(current) + 1) }
}

export function returnSentence(r: ReturnRequest): string {
  switch (r.status) {
    case 'submitted': return 'Market đã nhận yêu cầu và sẽ phản hồi trong 3–5 ngày làm việc.'
    case 'under_review': return 'Market đang xem xét yêu cầu của bạn và sẽ phản hồi trong 3–5 ngày làm việc.'
    case 'needs_evidence': return 'Market cần thêm ảnh để xem xét. Bạn bổ sung bằng chứng ở bên dưới.'
    case 'awaiting_return_shipment': return 'Yêu cầu đã được chấp nhận. Bạn gửi hàng về địa chỉ của Shop trước hạn.'
    case 'returning': return 'Hàng trả đang trên đường về Shop. Shop sẽ kiểm tra khi nhận được.'
    case 'inspecting': return 'Shop đã nhận hàng trả và đang kiểm tra. Market hoàn tiền khi kiểm tra xong.'
    case 'refunded': return 'Tiền đã được hoàn theo yêu cầu của bạn.'
    case 'rejected': return 'Yêu cầu không được chấp nhận.'
  }
}

/** Return-shipping deadline line: "còn 5 ngày" / "Hạn gửi hàng hôm nay" / expired. `urgent` on the last 2 days. */
export function deadlineCopy(deadline: number, now: number): { kind: 'left' | 'today' | 'expired'; text: string; urgent: boolean } {
  if (now >= deadline) return { kind: 'expired', text: 'Đã quá hạn gửi hàng trả', urgent: false }
  const d = calendarDaysLeft(deadline, now)
  if (d <= 0) return { kind: 'today', text: 'Hạn gửi hàng hôm nay', urgent: true }
  return { kind: 'left', text: `Gửi hàng trước ${dmy(deadline)} · còn ${d} ngày`, urgent: d <= 1 }
}

export const validTrackingCode = (s: string) => /^[A-Za-z0-9]{8,20}$/.test(s.trim())

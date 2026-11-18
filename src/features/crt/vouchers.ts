// Voucher display helpers shared by the cart (US-CRT-005) and checkout (US-CHK-004/005).
import { useEffect, useRef, useState } from 'react'
import { vnd } from '@/domain/money'
import { PAYMENT_LABEL } from '@/domain/orders'
import { voucherLabel, type Ineligible } from '@/domain/pricing'
import type { Voucher } from '@/domain/types'

const H7 = 7 * 3_600_000
/** "30/11/2026" in Vietnam time. */
export function dateVN(ms: number) {
  const d = new Date(ms + H7)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
}

/** "HSD: 30/11/2026", or "Sắp hết hạn: còn 1 giờ 45 phút" inside the last 24 hours. */
export function expiryText(endsAt: number, now: number) {
  const left = endsAt - now
  if (left > 0 && left < 86_400_000) {
    const h = Math.floor(left / 3_600_000), m = Math.floor((left % 3_600_000) / 60_000)
    return `Sắp hết hạn: còn ${h ? `${h} giờ ` : ''}${m} phút`
  }
  return `HSD: ${dateVN(endsAt)}`
}

export const methodsText = (ms: Ineligible & { kind: 'payment_method' }) => ms.methods.map((m) => PAYMENT_LABEL[m]).join(' hoặc ')

/** Reason under a disabled voucher in a sheet. */
export function sheetReason(r: Ineligible): string {
  switch (r.kind) {
    case 'min_spend': return `Mua thêm ${vnd(r.missing)} để dùng voucher`
    case 'expired': return 'Đã hết hạn'
    case 'not_started': return 'Chưa đến thời gian sử dụng'
    case 'out_of_quota': return 'Đã hết lượt sử dụng'
    case 'used_up': return 'Bạn đã dùng hết lượt của voucher này'
    case 'payment_method': return `Chỉ áp dụng khi thanh toán bằng ${methodsText(r)}`
  }
}

/** Short reason after a voucher label: "đã hết hạn". */
export function shortWhy(v: Voucher, r: Ineligible): string {
  switch (r.kind) {
    case 'min_spend': return `chưa đủ đơn tối thiểu ${vnd(v.minSpend)}`
    case 'expired': return 'đã hết hạn'
    case 'out_of_quota': return 'đã hết lượt sử dụng'
    case 'used_up': return 'bạn đã dùng hết lượt'
    case 'not_started': return 'chưa đến thời gian sử dụng'
    case 'payment_method': return `chỉ áp dụng khi thanh toán bằng ${methodsText(r)}`
  }
}

/** Inline note when an applied voucher stops holding: rules.md#voucher-math item 6. */
export function dropNote(v: Voucher, r: Ineligible): string {
  const label = voucherLabel(v)
  if (r.kind === 'payment_method') return `Voucher ${label} chỉ áp dụng khi thanh toán bằng ${methodsText(r)}. Đã gỡ voucher.`
  return `Voucher ${label} không còn áp dụng: ${shortWhy(v, r)}`
}

export type Applied = Record<string, Voucher | undefined>
/**
 * Next notes per slot: a slot whose applied voucher went away while that voucher is now ineligible gets a note;
 * a slot that gets a new voucher loses its note.
 */
export function nextNotes(prev: Applied, next: Applied, notes: Record<string, string>, why: (slot: string, v: Voucher) => Ineligible | null) {
  const out = { ...notes }
  for (const slot of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    const p = prev[slot], n = next[slot]
    if (p?.id === n?.id) continue
    if (n) delete out[slot]
    if (p) { const r = why(slot, p); if (r) out[slot] = dropNote(p, r) }
  }
  return out
}

/** Keeps drop notes across renders, re-evaluated whenever the applied vouchers change. */
export function useDropNotes(applied: Applied, why: (slot: string, v: Voucher) => Ineligible | null) {
  const prev = useRef(applied)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const key = JSON.stringify(Object.entries(applied).map(([k, v]) => [k, v?.id]))
  useEffect(() => {
    const p = prev.current
    prev.current = applied
    setNotes((n) => nextNotes(p, applied, n, why))
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return notes
}

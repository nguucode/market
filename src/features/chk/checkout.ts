// Pure checkout logic: payment availability (US-CHK-004), last-moment diff (US-CHK-006), payment page (US-CHK-007),
// result redirect (US-CHK-008). Pricing itself is `quoteCheckout` / `price` in the store and domain.
import { vnd } from '@/domain/money'
import { COD_CAP } from '@/domain/orders'
import { voucherLabel, type Ineligible } from '@/domain/pricing'
import type { Payment, PaymentMethod, Voucher } from '@/domain/types'
import { shortWhy } from '@/features/crt/vouchers'

export const METHODS: PaymentMethod[] = ['cod', 'vietqr', 'wallet', 'card']
export const WALLETS = ['Ví Sen', 'Ví Mây'] as const

/** COD for the whole session: off when any shop has it off or any shop order exceeds the cap (rules.md#payment). */
export function codState(shops: { name: string; codEnabled: boolean; total: number }[]): { ok: true } | { ok: false; reason: string } {
  const off = shops.find((s) => !s.codEnabled)
  if (off) return { ok: false, reason: `${off.name} không hỗ trợ Thanh toán khi nhận hàng` }
  if (shops.some((s) => s.total > COD_CAP)) return { ok: false, reason: `Thanh toán khi nhận hàng chỉ áp dụng cho đơn đến ${vnd(COD_CAP)}` }
  return { ok: true }
}

/* ── Place-order diff ─────────────────────────────────────────────── */

export type Row = { text: string; removed?: boolean; total?: boolean }
type Line = { skuId: string; qty: number; cartLineId?: string }

/** Drops lines that can no longer be bought and clamps quantities to stock. */
export function reconcileLines<L extends Line>(lines: L[], look: (skuId: string) => { name: string; stock: number; active: boolean }) {
  const rows: Row[] = []
  const out: L[] = []
  for (const l of lines) {
    const s = look(l.skuId)
    if (!s.active) rows.push({ text: `${s.name}: sản phẩm đã ngừng bán, đã bỏ khỏi đơn`, removed: true })
    else if (s.stock <= 0) rows.push({ text: `${s.name}: đã hết hàng, đã bỏ khỏi đơn`, removed: true })
    else if (s.stock < l.qty) { rows.push({ text: `${s.name}: chỉ còn ${s.stock} sản phẩm, đã cập nhật số lượng` }); out.push({ ...l, qty: s.stock }) }
    else out.push(l)
  }
  return { lines: out, rows }
}

type Priced = { skuId: string; name: string; unit: number }
export function priceRows(before: Priced[], after: Priced[]): Row[] {
  return after.flatMap((a) => {
    const b = before.find((x) => x.skuId === a.skuId)
    return b && b.unit !== a.unit ? [{ text: `${a.name}: ${vnd(b.unit)} → ${vnd(a.unit)}` }] : []
  })
}

export function voucherRows(before: Voucher[], after: Voucher[], why: (v: Voucher) => Ineligible | null): Row[] {
  return before.filter((v) => !after.some((x) => x.id === v.id)).map((v) => {
    const r = why(v)
    return { text: `Voucher ${voucherLabel(v)}: ${r ? shortWhy(v, r) : 'không còn áp dụng'}, đã gỡ` }
  })
}

export const totalRow = (a: number, b: number): Row[] => (a === b ? [] : [{ text: `Tổng thanh toán ${vnd(a)} → ${vnd(b)}`, total: true }])

/* ── Online payment ───────────────────────────────────────────────── */

export const remainingSeconds = (expiresAt: number, now: number) => Math.max(0, Math.ceil((expiresAt - now) / 1000))
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/** Transfer content for VietQR: "MK" + the payment id digits. */
export const transferContent = (paymentId: string) => `MK${paymentId.replace(/\D/g, '').padStart(8, '0')}`

/** Test cards printed in the form note; nothing else is accepted. */
export const TEST_CARDS = ['4111 1111 1111 1111', '5555 5555 5555 4444']
export function luhn(digits: string) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return digits.length > 0 && sum % 10 === 0
}
export function isTestCard(number: string) {
  const d = number.replace(/\D/g, '')
  return luhn(d) && TEST_CARDS.some((c) => c.replace(/\D/g, '') === d)
}
export const formatCard = (s: string) => s.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
/** "MM/YY" not in the past. */
export function validExpiry(s: string, now: number) {
  const m = /^(\d{2})\/(\d{2})$/.exec(s)
  if (!m) return false
  const month = Number(m[1]), year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const d = new Date(now)
  return year > d.getUTCFullYear() || (year === d.getUTCFullYear() && month >= d.getUTCMonth() + 1)
}

/** Result page for a payment: null to show it, or where to go instead. */
export function resultRedirect(p: Pick<Payment, 'id' | 'method' | 'status'>): string | null {
  if (p.method === 'cod' || p.status === 'paid') return null
  return `/checkout/pay/${p.id}`
}
/** Pay page: a paid or COD payment goes to its result. */
export const payRedirect = (p: Pick<Payment, 'id' | 'method' | 'status'>) => (p.method === 'cod' || p.status === 'paid' ? `/checkout/result/${p.id}` : null)

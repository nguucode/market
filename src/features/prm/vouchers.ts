// Voucher tile copy, states and hub lists: US-PRM-002, US-PRM-003, US-HOM-004. Pure.
import { vnd } from '@/domain/money'
import { PAYMENT_LABEL } from '@/domain/orders'
import { ineligibility } from '@/domain/pricing'
import type { SavedVoucher, Shop, Voucher } from '@/domain/types'
import { formatCountdown } from '@/features/hom/flash'
import { fmtDate, fmtTime } from '@/features/ntf/time'

const DAY = 86_400_000

export type TileState = 'claimable' | 'saved' | 'exhausted' | 'used_up' | 'expired'
export function voucherTileState(v: Voucher, saved: SavedVoucher | undefined, now: number): TileState {
  if (now >= v.endsAt) return 'expired'
  if (saved) return saved.usedCount >= v.perBuyerLimit ? 'used_up' : 'saved'
  return v.usedCount >= v.totalQuota ? 'exhausted' : 'claimable'
}

/** Inline result when "Lưu" fails between render and press. */
export const claimFailText = (v: Voucher, now: number) =>
  ineligibility(v, Number.MAX_SAFE_INTEGER, { now })?.kind === 'expired' ? 'Voucher đã hết hạn.' : 'Voucher đã hết lượt lưu.'

/** "Giảm 15%", "Giảm 30.000₫", "Miễn phí vận chuyển". */
export function voucherOffer(v: Voucher): string {
  if (v.scope === 'shipping') return 'Miễn phí vận chuyển'
  return v.kind === 'percent' ? `Giảm ${v.value}%` : `Giảm ${vnd(v.value)}`
}

/** "Tối đa 50.000₫ · Đơn tối thiểu 300.000₫". */
export function voucherCapLine(v: Voucher): string {
  const parts: string[] = []
  if (v.scope === 'shipping') parts.push(`Tối đa ${vnd(v.maxPerShop ?? v.value)} mỗi shop`)
  else if (v.kind === 'percent' && v.maxDiscount) parts.push(`Tối đa ${vnd(v.maxDiscount)}`)
  parts.push(v.minSpend > 0 ? `Đơn tối thiểu ${vnd(v.minSpend)}` : 'Không cần đơn tối thiểu')
  return parts.join(' · ')
}

/** "HSD: 30/11/2026", or "Hết hạn sau 2 giờ" under 24 hours, or "Bắt đầu sau 3 giờ" before start. */
export function voucherExpiry(v: Voucher, now: number): string {
  if (now < v.startsAt) return `Bắt đầu sau ${formatCountdown(v.startsAt - now)}`
  if (v.endsAt - now < DAY) return `Hết hạn sau ${formatCountdown(v.endsAt - now)}`
  return `HSD: ${fmtDate(v.endsAt)}`
}

export const paymentLine = (v: Voucher) =>
  v.paymentMethods?.length ? `Chỉ áp dụng khi thanh toán bằng ${v.paymentMethods.map((m) => PAYMENT_LABEL[m]).join(', ')}` : undefined

/** "Còn 1 lượt dùng" when saved and partly used. */
export function usesLeftLine(v: Voucher, saved?: SavedVoucher): string | undefined {
  if (!saved || saved.usedCount === 0) return undefined
  const k = v.perBuyerLimit - saved.usedCount
  return k > 0 ? `Còn ${k} lượt dùng` : undefined
}

/* ── Hub ── */

export type HubTab = 'all' | 'platform' | 'shop' | 'shipping' | 'expiring'
export const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'platform', label: 'Voucher Market' },
  { id: 'shop', label: 'Voucher của Shop' },
  { id: 'shipping', label: 'Voucher miễn phí vận chuyển' },
  { id: 'expiring', label: 'Sắp hết hạn' },
]
export type HubItem = { voucher: Voucher; saved?: SavedVoucher; state: TileState }

/** Saved first, then claimable (exhausted shown disabled), each by soonest expiry. Expired and used-up are hidden (history is P1). */
export function hubList(vouchers: Voucher[], saved: SavedVoucher[], tab: HubTab, now: number): HubItem[] {
  const byId = new Map(saved.map((s) => [s.voucherId, s]))
  const items = vouchers
    .map((v) => ({ voucher: v, saved: byId.get(v.id), state: voucherTileState(v, byId.get(v.id), now) }))
    .filter((x) => x.state !== 'expired' && x.state !== 'used_up' && (!x.voucher.credit || x.saved))
    .filter((x) => (tab === 'all' ? true : tab === 'expiring' ? x.state === 'saved' && x.voucher.endsAt - now <= 3 * DAY : x.voucher.scope === tab))
  const soonest = (a: HubItem, b: HubItem) => a.voucher.endsAt - b.voucher.endsAt
  return [...items.filter((x) => x.saved).sort(soonest), ...items.filter((x) => !x.saved).sort(soonest)]
}

/** Typical basket used to rank percent vouchers on Home. */
export const TYPICAL_BASKET = 400_000
export const estimatedValue = (v: Voucher) => (v.kind === 'amount' ? v.value : Math.min(Math.floor((v.value * TYPICAL_BASKET) / 100), v.maxDiscount ?? Infinity))

/** Home strip: up to 3 started, claimable-or-saved platform vouchers, best value first. */
export function pickHomeVouchers(vouchers: Voucher[], saved: SavedVoucher[], now: number): HubItem[] {
  return hubList(vouchers, saved, 'platform', now)
    .filter((x) => !x.voucher.credit && x.state !== 'exhausted' && x.voucher.startsAt <= now)
    .sort((a, b) => estimatedValue(b.voucher) - estimatedValue(a.voucher) || a.voucher.endsAt - b.voucher.endsAt)
    .slice(0, 3)
}

/* ── Conditions sheet ── */

export type ConditionRow = { label: string; value: string; note?: string; href?: string }
export function describeVoucher(v: Voucher, saved: SavedVoucher | undefined, shop: Pick<Shop, 'name' | 'handle'> | undefined, now: number): ConditionRow[] {
  const offer = v.scope === 'shipping'
    ? `Giảm phí vận chuyển tối đa ${vnd(v.maxPerShop ?? v.value)} mỗi shop`
    : v.kind === 'percent' ? `Giảm ${v.value}%${v.maxDiscount ? `, tối đa ${vnd(v.maxDiscount)}` : ''}` : `Giảm ${vnd(v.value)}`
  const base = v.scope === 'shop' ? 'tiền hàng của Shop (sản phẩm được chọn)' : 'tiền hàng sau Voucher của Shop, không gồm phí vận chuyển'
  const left = v.endsAt - now
  const timing = now < v.startsAt ? `Bắt đầu sau ${formatCountdown(v.startsAt - now)}` : left > 0 && left < DAY ? `Hết hạn sau ${formatCountdown(left)}` : undefined
  const claimedPct = Math.floor((v.usedCount / v.totalQuota) * 100)
  const uses = [
    saved && saved.usedCount > 0 && saved.usedCount < v.perBuyerLimit ? `Bạn còn ${v.perBuyerLimit - saved.usedCount} lượt` : '',
    claimedPct > 80 ? `Đã lưu ${Math.min(100, claimedPct)}%` : '',
  ].filter(Boolean).join(' · ')
  return [
    { label: 'Ưu đãi', value: offer },
    { label: 'Đơn tối thiểu', value: v.minSpend > 0 ? `${vnd(v.minSpend)} ${base}` : 'Không có' },
    { label: 'Hạn sử dụng', value: `${fmtTime(v.startsAt)} ${fmtDate(v.startsAt)} – ${fmtTime(v.endsAt)} ${fmtDate(v.endsAt)}`, note: timing },
    v.scope === 'shop'
      ? { label: 'Áp dụng cho', value: `Sản phẩm của Shop ${shop?.name ?? ''}`.trim(), href: shop ? `/s/${shop.handle}` : undefined }
      : { label: 'Áp dụng cho', value: v.scope === 'platform' ? 'Tất cả sản phẩm trên Market' : 'Phí vận chuyển của mọi shop trong đơn' },
    { label: 'Phương thức thanh toán', value: paymentLine(v) ?? 'Tất cả phương thức' },
    { label: 'Lượt dùng', value: `Mỗi tài khoản dùng ${v.perBuyerLimit} lần`, note: uses || undefined },
  ]
}

/** "Dùng ngay" target: shop voucher → shop page, others → cart. */
export const applyTarget = (v: Voucher, shopHandle?: string) => (v.scope === 'shop' && shopHandle ? `/s/${shopHandle}` : '/cart')

// Notification list helpers: US-NTF-001. Pure.
import type { Notification } from '@/domain/types'
import type { World } from '@/mock/seed'
import { voucherOffer } from '@/features/prm/vouchers'

export type NtfTab = 'orders' | 'promotions' | 'system'
export const NTF_TABS: { id: NtfTab; kind: Notification['kind']; label: string; empty: string }[] = [
  { id: 'orders', kind: 'order', label: 'Đơn hàng', empty: 'Cập nhật về đơn hàng sẽ xuất hiện ở đây.' },
  { id: 'promotions', kind: 'promotion', label: 'Ưu đãi', empty: 'Ưu đãi dành cho bạn sẽ xuất hiện ở đây.' },
  { id: 'system', kind: 'system', label: 'Hệ thống', empty: 'Thông báo từ Market sẽ xuất hiện ở đây.' },
]

export function groupUnread(ns: Notification[]): Record<Notification['kind'], number> {
  const out = { order: 0, promotion: 0, system: 0 }
  for (const n of ns) if (!n.read) out[n.kind] += 1
  return out
}
/** "Đơn hàng (3)", capped at "(99+)". */
export const tabLabel = (label: string, unread: number) => (unread > 0 ? `${label} (${unread > 99 ? '99+' : unread})` : label)

/** Newest first, one kind. */
export const listFor = (ns: Notification[], kind: Notification['kind']) => ns.filter((n) => n.kind === kind).sort((a, b) => b.createdAt - a.createdAt)

export type Thumb = { kind: 'image'; src: string } | { kind: 'voucher'; text: string } | { kind: 'mark' }
/** Product photo for order, return and product links; the offer for voucher links; the Market mark otherwise. */
export function notificationThumb(n: Notification, w: World): Thumb {
  const link = n.link ?? ''
  const param = (re: RegExp) => link.match(re)?.[1]
  const orderImage = (orderId?: string) => w.orders.find((o) => o.id === orderId)?.lines[0]?.image
  const img = orderImage(param(/^\/orders\/([^/?]+)/))
    ?? orderImage(w.returns.find((r) => r.id === param(/^\/returns\/([^/?]+)/))?.orderId)
    ?? w.products.find((p) => p.slug === param(/^\/p\/([^/?]+)/))?.images[0]
  if (img) return { kind: 'image', src: img }
  const vid = param(/[?&]voucher=([^&]+)/)
  const v = vid && w.vouchers.find((x) => x.id === vid)
  if (v) return { kind: 'voucher', text: voucherOffer(v) }
  return { kind: 'mark' }
}

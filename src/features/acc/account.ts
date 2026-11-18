// Pure account logic: addresses (US-ACC-002/003), Me counts (US-ACC-001), favourite card state (US-ACC-004).
import { tabOf } from '@/domain/orders'
import type { Address, Order, Product, Sku } from '@/domain/types'
import { MAX_ADDRESSES } from '@/app/store'

export const NAME_MAX = 50
export const DETAIL_MAX = 120

/** "{detail}, {ward}, {province}": rules.md#address. */
export const addressLine = (a: Pick<Address, 'detail' | 'wardName' | 'provinceName'>) => `${a.detail}, ${a.wardName}, ${a.provinceName}`
export const LABEL_TEXT: Record<Address['label'], string> = { home: 'Nhà riêng', office: 'Văn phòng' }

export const phoneDigits = (s: string) => s.replace(/\D/g, '').slice(0, 10)
export const isValidVnPhone = (digits: string) => /^0\d{9}$/.test(digits)
/** "0905 123 456" while typing. */
export function formatPhone(s: string) {
  const d = phoneDigits(s)
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7)].filter(Boolean).join(' ')
}
/** "0905 *** 456". */
export function maskPhone(s: string) {
  const d = phoneDigits(s)
  return d.length === 10 ? `${d.slice(0, 4)} *** ${d.slice(7)}` : s
}

export type AddressInput = { name: string; phone: string; provinceCode?: number; wardCode?: number; detail: string }
export type AddressErrors = Partial<Record<'name' | 'phone' | 'province' | 'ward' | 'detail', string>>
export function validateAddress(a: AddressInput): AddressErrors {
  const e: AddressErrors = {}
  if (!a.name.trim()) e.name = 'Vui lòng nhập họ và tên'
  if (!isValidVnPhone(phoneDigits(a.phone))) e.phone = 'Số điện thoại không hợp lệ'
  if (!a.provinceCode) e.province = 'Vui lòng chọn Tỉnh/Thành phố'
  if (!a.wardCode) e.ward = 'Vui lòng chọn Phường/Xã/Đặc khu'
  if (!a.detail.trim()) e.detail = 'Vui lòng nhập địa chỉ cụ thể'
  return e
}

const seqOf = (id: string) => Number(id.replace(/\D/g, '')) || 0
/** Default first, the rest newest first. */
export const sortAddresses = (xs: Address[]) => [...xs].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || seqOf(b.id) - seqOf(a.id))

export function canDeleteAddress(a: Address, all: Address[]): { ok: true } | { ok: false; reason: string } {
  return a.isDefault && all.length > 1 ? { ok: false, reason: 'Không thể xóa địa chỉ mặc định. Hãy chọn địa chỉ khác làm mặc định trước.' } : { ok: true }
}
export const canAddAddress = (all: Address[]) => all.length < MAX_ADDRESSES

/** Me shortcuts: "Chờ lấy hàng" holds to_confirm + to_ship (object-model.md#enums). */
export function orderTabCounts(orders: Order[]) {
  const c = { awaiting_payment: 0, to_ship: 0, shipping: 0, delivered: 0 }
  for (const o of orders) {
    const t = tabOf(o)
    // "Đã giao" counts only orders still waiting for "Đã nhận được hàng"; completed ones are history.
    if (t === 'delivered' && o.status !== 'delivered') continue
    if (t in c) c[t as keyof typeof c] += 1
  }
  return c
}
export const badgeText = (n: number) => (n > 99 ? '99+' : String(n))

export const favoriteCardState = (p: Product, skus: Sku[]): 'available' | 'out_of_stock' | 'delisted' =>
  p.status === 'delisted' ? 'delisted' : skus.some((k) => k.stock > 0) ? 'available' : 'out_of_stock'

/** Diacritic- and case-insensitive match: "da nang" matches "Đà Nẵng". */
export const normalizeVi = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim()
export const matchVi = (name: string, q: string) => normalizeVi(name).includes(normalizeVi(q))

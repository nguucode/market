import { describe, expect, test } from 'vitest'
import type { SavedVoucher, Voucher } from '@/domain/types'
import { claimFailText, describeVoucher, hubList, pickHomeVouchers, usesLeftLine, applyTarget, voucherCapLine, voucherExpiry, voucherOffer, voucherTileState } from './vouchers'

const H = 3_600_000, D = 24 * H
const now = new Date(2026, 10, 18, 10, 0).getTime()
const v = (o: Partial<Voucher> & { id: string }): Voucher => ({
  code: o.id, scope: 'platform', kind: 'amount', value: 30_000, minSpend: 0, startsAt: now - D, endsAt: now + 10 * D, totalQuota: 100, usedCount: 0, perBuyerLimit: 1, ...o,
})
const sv = (voucherId: string, usedCount = 0): SavedVoucher => ({ voucherId, savedAt: now - D, usedCount })

describe('voucherTileState', () => {
  test('each state', () => {
    expect(voucherTileState(v({ id: 'a' }), undefined, now)).toBe('claimable')
    expect(voucherTileState(v({ id: 'a' }), sv('a'), now)).toBe('saved')
    expect(voucherTileState(v({ id: 'a', usedCount: 100 }), undefined, now)).toBe('exhausted')
    expect(voucherTileState(v({ id: 'a', usedCount: 100 }), sv('a'), now)).toBe('saved')
    expect(voucherTileState(v({ id: 'a' }), sv('a', 1), now)).toBe('used_up')
    expect(voucherTileState(v({ id: 'a', endsAt: now }), sv('a'), now)).toBe('expired')
  })
  test('claim failure text', () => {
    expect(claimFailText(v({ id: 'a', endsAt: now - 1 }), now)).toBe('Voucher đã hết hạn.')
    expect(claimFailText(v({ id: 'a', usedCount: 100 }), now)).toBe('Voucher đã hết lượt lưu.')
  })
})

describe('tile copy', () => {
  test('offer', () => {
    expect(voucherOffer(v({ id: 'a', kind: 'percent', value: 15 }))).toBe('Giảm 15%')
    expect(voucherOffer(v({ id: 'a' }))).toBe('Giảm 30.000₫')
    expect(voucherOffer(v({ id: 'a', value: 1_000_000 }))).toBe('Giảm 1.000.000₫')
    expect(voucherOffer(v({ id: 'a', scope: 'shipping' }))).toBe('Miễn phí vận chuyển')
  })
  test('cap line', () => {
    expect(voucherCapLine(v({ id: 'a', kind: 'percent', value: 15, maxDiscount: 50_000, minSpend: 300_000 }))).toBe('Tối đa 50.000₫ · Đơn tối thiểu 300.000₫')
    expect(voucherCapLine(v({ id: 'a' }))).toBe('Không cần đơn tối thiểu')
    expect(voucherCapLine(v({ id: 'a', scope: 'shipping', maxPerShop: 25_000 }))).toBe('Tối đa 25.000₫ mỗi shop · Không cần đơn tối thiểu')
  })
  test('expiry', () => {
    expect(voucherExpiry(v({ id: 'a', endsAt: new Date(2026, 10, 30, 23, 59).getTime() }), now)).toBe('HSD: 30/11/2026')
    expect(voucherExpiry(v({ id: 'a', endsAt: now + 2 * H }), now)).toBe('Hết hạn sau 2 giờ')
    expect(voucherExpiry(v({ id: 'a', startsAt: now + 3 * H }), now)).toBe('Bắt đầu sau 3 giờ')
  })
  test('uses left', () => {
    expect(usesLeftLine(v({ id: 'a', perBuyerLimit: 2 }), sv('a', 1))).toBe('Còn 1 lượt dùng')
    expect(usesLeftLine(v({ id: 'a', perBuyerLimit: 2 }), sv('a', 0))).toBeUndefined()
  })
  test('use target', () => {
    expect(applyTarget(v({ id: 'a', scope: 'shop' }), 'bep')).toBe('/s/bep')
    expect(applyTarget(v({ id: 'a', scope: 'shipping' }))).toBe('/cart')
  })
})

describe('hubList', () => {
  const vs = [
    v({ id: 'p-late', endsAt: now + 9 * D }),
    v({ id: 'p-soon', endsAt: now + 2 * D }),
    v({ id: 's-saved', scope: 'shop', shopId: 's1', endsAt: now + 8 * D }),
    v({ id: 'ship-saved-soon', scope: 'shipping', endsAt: now + 1 * D }),
    v({ id: 'expired', endsAt: now - 1 }),
    v({ id: 'usedup' }),
    v({ id: 'exhausted', usedCount: 100, endsAt: now + 5 * D }),
    v({ id: 'credit', credit: true, endsAt: now + 30 * D }),
    v({ id: 'credit-unsaved', credit: true }),
  ]
  const saved = [sv('s-saved'), sv('ship-saved-soon'), sv('usedup', 1), sv('credit')]
  test('all: saved first then claimable, each by soonest expiry; hides expired, used up and unsaved credits', () => {
    expect(hubList(vs, saved, 'all', now).map((x) => x.voucher.id)).toEqual(['ship-saved-soon', 's-saved', 'credit', 'p-soon', 'exhausted', 'p-late'])
  })
  test('scope tabs', () => {
    expect(hubList(vs, saved, 'shop', now).map((x) => x.voucher.id)).toEqual(['s-saved'])
    expect(hubList(vs, saved, 'shipping', now).map((x) => x.voucher.id)).toEqual(['ship-saved-soon'])
  })
  test('expiring: saved and ending within 3 days', () => {
    expect(hubList(vs, saved, 'expiring', now).map((x) => x.voucher.id)).toEqual(['ship-saved-soon'])
  })
})

test('pickHomeVouchers: platform, started, claimable or saved, best value, top 3', () => {
  const vs = [
    v({ id: 'pct', kind: 'percent', value: 15, maxDiscount: 50_000 }), // 50.000 at the typical basket
    v({ id: 'amt20', value: 20_000 }),
    v({ id: 'amt30', value: 30_000 }),
    v({ id: 'amt40-future', value: 40_000, startsAt: now + H }),
    v({ id: 'big-exhausted', value: 90_000, usedCount: 100 }),
    v({ id: 'ship', scope: 'shipping', value: 99_000 }),
    v({ id: 'amt10', value: 10_000 }),
  ]
  expect(pickHomeVouchers(vs, [sv('amt20')], now).map((x) => x.voucher.id)).toEqual(['pct', 'amt30', 'amt20'])
})

describe('describeVoucher', () => {
  const rows = (x: Voucher, s?: SavedVoucher) => Object.fromEntries(describeVoucher(x, s, { name: 'Bếp Việt', handle: 'bep-viet' }, now).map((r) => [r.label, r]))
  test('platform percent with payment restriction', () => {
    const r = rows(v({ id: 'a', kind: 'percent', value: 15, maxDiscount: 50_000, minSpend: 300_000, paymentMethods: ['wallet'], endsAt: now + 2 * H }))
    expect(Object.keys(r)).toEqual(['Ưu đãi', 'Đơn tối thiểu', 'Hạn sử dụng', 'Áp dụng cho', 'Phương thức thanh toán', 'Lượt dùng'])
    expect(r['Ưu đãi'].value).toBe('Giảm 15%, tối đa 50.000₫')
    expect(r['Đơn tối thiểu'].value).toBe('300.000₫ tiền hàng sau Voucher của Shop, không gồm phí vận chuyển')
    expect(r['Hạn sử dụng'].value).toBe('10:00 17/11/2026 – 12:00 18/11/2026')
    expect(r['Hạn sử dụng'].note).toBe('Hết hạn sau 2 giờ')
    expect(r['Áp dụng cho'].value).toBe('Tất cả sản phẩm trên Market')
    expect(r['Phương thức thanh toán'].value).toBe('Chỉ áp dụng khi thanh toán bằng Ví điện tử')
    expect(r['Lượt dùng'].value).toBe('Mỗi tài khoản dùng 1 lần')
  })
  test('shop amount, minSpend 0, not started, partly used, nearly claimed', () => {
    const r = rows(v({ id: 'a', scope: 'shop', shopId: 's', startsAt: now + 3 * H, perBuyerLimit: 2, usedCount: 85 }), sv('a', 1))
    expect(r['Ưu đãi'].value).toBe('Giảm 30.000₫')
    expect(r['Đơn tối thiểu'].value).toBe('Không có')
    expect(r['Hạn sử dụng'].note).toBe('Bắt đầu sau 3 giờ')
    expect(r['Áp dụng cho']).toMatchObject({ value: 'Sản phẩm của Shop Bếp Việt', href: '/s/bep-viet' })
    expect(r['Phương thức thanh toán'].value).toBe('Tất cả phương thức')
    expect(r['Lượt dùng'].note).toBe('Bạn còn 1 lượt · Đã lưu 85%')
  })
  test('shop min spend base and shipping offer', () => {
    expect(rows(v({ id: 'a', scope: 'shop', minSpend: 300_000 }))['Đơn tối thiểu'].value).toBe('300.000₫ tiền hàng của Shop (sản phẩm được chọn)')
    const r = rows(v({ id: 'a', scope: 'shipping', maxPerShop: 25_000 }))
    expect(r['Ưu đãi'].value).toBe('Giảm phí vận chuyển tối đa 25.000₫ mỗi shop')
    expect(r['Áp dụng cho'].value).toBe('Phí vận chuyển của mọi shop trong đơn')
  })
})

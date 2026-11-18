import { quoteCheckout, type CheckoutDraft } from '@/app/store'
import type { Voucher } from '@/domain/types'
import { seedWorld } from '@/mock/seed'
import {
  codState, isTestCard, mmss, payRedirect, priceRows, reconcileLines, remainingSeconds, resultRedirect, totalRow, transferContent, validExpiry, voucherRows,
} from './checkout'

const T = Date.UTC(2026, 10, 18, 3)

describe('§4.3 checkout through the store engine', () => {
  it('prices 723.000₫ goods to 653.000₫ in two orders', () => {
    const w = seedWorld(T)
    const lines = ['cl1', 'cl2', 'cl3'].map((id) => { const l = w.cart.find((x) => x.id === id)!; return { skuId: l.skuId, qty: l.qty, cartLineId: id } })
    const d: CheckoutDraft = { id: 'x', source: 'cart', lines, shipping: {}, payment: 'cod', shopVoucher: {}, messages: {} }
    const q = quoteCheckout(w, d, T)
    expect(q.pricing.goods).toBe(723_000)
    expect(q.pricing.total).toBe(653_000)
    expect(q.pricing.shops.map((s) => s.total).sort((a, b) => b - a)).toEqual([415_677, 237_323])
  })
})

describe('codState', () => {
  it('names the shop that has COD off, then the cap', () => {
    expect(codState([{ name: 'A', codEnabled: true, total: 1 }, { name: 'Bước Chân', codEnabled: false, total: 1 }]))
      .toEqual({ ok: false, reason: 'Bước Chân không hỗ trợ Thanh toán khi nhận hàng' })
    expect(codState([{ name: 'A', codEnabled: true, total: 12_499_000 }])).toEqual({ ok: false, reason: 'Thanh toán khi nhận hàng chỉ áp dụng cho đơn đến 10.000.000₫' })
    expect(codState([{ name: 'A', codEnabled: true, total: 9_999_999 }]).ok).toBe(true)
  })
})

describe('place-order diff', () => {
  it('drops unavailable lines and clamps quantities', () => {
    const look = (id: string) => ({ a: { name: 'Áo', stock: 1, active: true }, b: { name: 'Bàn', stock: 0, active: true }, c: { name: 'Cốc', stock: 5, active: false }, d: { name: 'Dép', stock: 9, active: true } })[id]!
    const r = reconcileLines([{ skuId: 'a', qty: 3 }, { skuId: 'b', qty: 1 }, { skuId: 'c', qty: 1 }, { skuId: 'd', qty: 2 }], look)
    expect(r.lines).toEqual([{ skuId: 'a', qty: 1 }, { skuId: 'd', qty: 2 }])
    expect(r.rows.map((x) => x.text)).toEqual(['Áo: chỉ còn 1 sản phẩm, đã cập nhật số lượng', 'Bàn: đã hết hàng, đã bỏ khỏi đơn', 'Cốc: sản phẩm đã ngừng bán, đã bỏ khỏi đơn'])
  })
  it('price, voucher and total rows; empty when nothing changed', () => {
    expect(priceRows([{ skuId: 'a', name: 'Áo', unit: 189_000 }], [{ skuId: 'a', name: 'Áo', unit: 199_000 }])[0].text).toBe('Áo: 189.000₫ → 199.000₫')
    expect(priceRows([{ skuId: 'a', name: 'Áo', unit: 1 }], [{ skuId: 'a', name: 'Áo', unit: 1 }])).toEqual([])
    const v = { id: 'v', scope: 'platform', kind: 'amount', value: 20_000, minSpend: 0 } as Voucher
    expect(voucherRows([v], [], () => ({ kind: 'expired' }))[0].text).toBe('Voucher Giảm 20K: đã hết hạn, đã gỡ')
    expect(voucherRows([v], [v], () => null)).toEqual([])
    expect(totalRow(653_000, 671_000)[0].text).toBe('Tổng thanh toán 653.000₫ → 671.000₫')
    expect(totalRow(1, 1)).toEqual([])
  })
})

describe('online payment', () => {
  it('countdown never goes negative', () => {
    expect(remainingSeconds(T + 15 * 60_000, T)).toBe(900)
    expect(remainingSeconds(T, T + 5000)).toBe(0)
    expect(mmss(899)).toBe('14:59')
    expect(mmss(45)).toBe('00:45')
  })
  it('accepts only the listed test cards', () => {
    expect(isTestCard('4111 1111 1111 1111')).toBe(true)
    expect(isTestCard('4111111111111112')).toBe(false)
    expect(isTestCard('4242 4242 4242 4242')).toBe(false) // valid Luhn, not on the list
    expect(validExpiry('12/30', T)).toBe(true)
    expect(validExpiry('10/26', T)).toBe(false)
    expect(validExpiry('13/30', T)).toBe(false)
  })
  it('transfer content and redirects', () => {
    expect(transferContent('pay123')).toBe('MK00000123')
    expect(resultRedirect({ id: 'p', method: 'cod', status: 'pending' })).toBeNull()
    expect(resultRedirect({ id: 'p', method: 'vietqr', status: 'pending' })).toBe('/checkout/pay/p')
    expect(resultRedirect({ id: 'p', method: 'card', status: 'expired' })).toBe('/checkout/pay/p')
    expect(resultRedirect({ id: 'p', method: 'card', status: 'paid' })).toBeNull()
    expect(payRedirect({ id: 'p', method: 'wallet', status: 'paid' })).toBe('/checkout/result/p')
    expect(payRedirect({ id: 'p', method: 'wallet', status: 'failed' })).toBeNull()
  })
})

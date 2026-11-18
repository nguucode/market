import { quoteCheckout } from '@/app/store'
import type { Voucher } from '@/domain/types'
import { seedWorld } from '@/mock/seed'
import { cartSummary, orderGroups } from './cart'
import { dropNote, expiryText, nextNotes, sheetReason } from './vouchers'

const T = Date.UTC(2026, 10, 18, 3)
const v = (o: Partial<Voucher> & Pick<Voucher, 'id' | 'value' | 'minSpend'>): Voucher => ({
  code: o.id, scope: 'shop', kind: 'amount', startsAt: 0, endsAt: T + 10 * 86_400_000, totalQuota: 100, usedCount: 0, perBuyerLimit: 1, ...o,
})
const A = { shopId: 'A', lines: [{ id: 'a1', unitPrice: 298_000, qty: 1, beforePromo: 398_000 }, { id: 'a2', unitPrice: 180_000, qty: 1 }], vouchers: [v({ id: 'linen30', value: 30_000, minSpend: 450_000 })] }
const B = { shopId: 'B', lines: [{ id: 'b1', unitPrice: 245_000, qty: 1, beforePromo: 289_000 }], vouchers: [v({ id: 'chao20', value: 20_000, minSpend: 299_000 })] }

describe('cartSummary (§4.3 shops)', () => {
  it('auto-applies Shop A voucher and nudges Shop B by 54.000₫', () => {
    const s = cartSummary([A, B], {}, { now: T })
    expect(s.shops[0].applied?.id).toBe('linen30')
    expect(s.shops[0].discount).toBe(30_000)
    expect(s.shops[1].applied).toBeUndefined()
    expect(s.shops[1].nudge).toBe(54_000)
    expect(s.goods).toBe(723_000)
    expect(s.total).toBe(693_000)
    expect(s.savings).toBe(100_000 + 44_000 + 30_000)
    expect(s.count).toBe(3)
  })
  it('drops the voucher when deselecting a line takes the shop below minimum', () => {
    const s = cartSummary([{ ...A, lines: A.lines.slice(0, 1) }, B], {}, { now: T })
    expect(s.shops[0].applied).toBeUndefined()
    expect(s.shops[0].nudge).toBe(152_000)
  })
  it('keeps a removed voucher removed (null) and has zero totals with nothing selected', () => {
    expect(cartSummary([A], { A: null }, { now: T }).shops[0].applied).toBeUndefined()
    const empty = cartSummary([{ ...A, lines: [] }], {}, { now: T })
    expect(empty).toMatchObject({ count: 0, total: 0, savings: 0 })
    expect(empty.shops[0].nudge).toBeUndefined()
  })
})

describe('cart total equals checkout Σ shop net for the seeded cart', () => {
  it('matches quoteCheckout to the đồng', async () => {
    const { cartGroups, lineAmount } = await import('@/app/store')
    const w = seedWorld(T)
    const { groups } = cartGroups(w, T)
    const inputs = groups.map((g) => ({
      shopId: g.shop.id,
      lines: g.lines.filter((l) => l.line.selected).map((l) => ({ id: l.line.id, unitPrice: lineAmount(l, w, T) / l.line.qty, qty: l.line.qty, beforePromo: l.before })),
      vouchers: w.vouchers.filter((x) => x.scope === 'shop' && x.shopId === g.shop.id && !x.credit),
    }))
    const s = cartSummary(inputs, {}, { now: T })
    const sel = groups.flatMap((g) => g.lines.filter((l) => l.line.selected))
    const q = quoteCheckout(w, { id: 'x', source: 'cart', lines: sel.map((l) => ({ skuId: l.sku.id, qty: l.line.qty })), shipping: {}, payment: 'cod', shopVoucher: {}, messages: {} }, T)
    expect(s.total).toBe(q.pricing.shops.reduce((a, x) => a + x.net, 0))
  })
})

describe('orderGroups', () => {
  it('orders groups and lines newest first', () => {
    const g = (id: string, ts: number[]) => ({ id, lines: ts.map((addedAt) => ({ line: { addedAt } })) })
    const out = orderGroups([g('x', [1, 5]), g('y', [9, 2])])
    expect(out.map((o) => o.id)).toEqual(['y', 'x'])
    expect(out[1].lines.map((l) => l.line.addedAt)).toEqual([5, 1])
  })
})

describe('voucher notes', () => {
  const vA = A.vouchers[0]
  it('notes a voucher that stopped holding, clears it when another applies', () => {
    const notes = nextNotes({ A: vA }, { A: undefined }, {}, () => ({ kind: 'min_spend', missing: 1 }))
    expect(notes.A).toBe('Voucher Giảm 30K không còn áp dụng: chưa đủ đơn tối thiểu 450.000₫')
    expect(nextNotes({ A: undefined }, { A: vA }, notes, () => null).A).toBeUndefined()
  })
  it('no note when the buyer removed a still-eligible voucher', () => {
    expect(nextNotes({ A: vA }, { A: undefined }, {}, () => null)).toEqual({})
  })
  it('payment-method removal and sheet reasons', () => {
    expect(dropNote(v({ id: 'w', value: 10, minSpend: 0, kind: 'percent', maxDiscount: 30_000 }), { kind: 'payment_method', methods: ['wallet'] }))
      .toBe('Voucher Giảm 10% tối đa 30K chỉ áp dụng khi thanh toán bằng Ví điện tử. Đã gỡ voucher.')
    expect(sheetReason({ kind: 'min_spend', missing: 54_000 })).toBe('Mua thêm 54.000₫ để dùng voucher')
  })
  it('expiry text', () => {
    expect(expiryText(Date.UTC(2026, 10, 30, 5), T)).toBe('HSD: 30/11/2026')
    expect(expiryText(T + 105 * 60_000, T)).toBe('Sắp hết hạn: còn 1 giờ 45 phút')
  })
})

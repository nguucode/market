// Pure cart logic: grouping order (US-CRT-001), totals (US-CRT-002), shop vouchers (US-CRT-005).
// Money comes from the same engine as checkout (`price`), so the cart total equals checkout Σ shop net.
import { bestVoucher, ineligibility, price, type PricingLine, type VoucherContext } from '@/domain/pricing'
import type { Voucher } from '@/domain/types'

/** Groups newest-first by their most recent line; lines newest first inside a group. */
export function orderGroups<G extends { lines: { line: { addedAt: number } }[] }>(groups: G[]): G[] {
  const latest = (g: G) => Math.max(...g.lines.map((l) => l.line.addedAt))
  return groups
    .map((g) => ({ ...g, lines: [...g.lines].sort((a, b) => b.line.addedAt - a.line.addedAt) }))
    .sort((a, b) => latest(b) - latest(a))
}

/** Per shop: `undefined` = auto (best eligible), `null` = buyer removed it, id = buyer's pick. */
export type VoucherChoice = Record<string, string | null | undefined>

export type CartShopInput = { shopId: string; lines: PricingLine[]; vouchers: Voucher[] }
export type CartShopResult = {
  shopId: string
  count: number
  goods: number
  applied?: Voucher
  discount: number
  /** Smallest "Mua thêm" amount to unlock a shop voucher when none applies. */
  nudge?: number
}
export type CartSummary = { shops: CartShopResult[]; count: number; goods: number; shopDiscount: number; total: number; savings: number }

/** Totals for the selected lines (`lines` holds only selected ones). */
export function cartSummary(shops: CartShopInput[], choice: VoucherChoice, ctx: VoucherContext, usedBy: (v: Voucher) => number = () => 0): CartSummary {
  const goodsOf = (s: CartShopInput) => s.lines.reduce((a, l) => a + l.unitPrice * l.qty, 0)
  const pick = (s: CartShopInput) => {
    const c = choice[s.shopId]
    if (c === null || !s.lines.length) return undefined
    if (c) return s.vouchers.find((v) => v.id === c)
    return bestVoucher(s.vouchers, goodsOf(s), ctx, undefined, usedBy)
  }
  const r = price({ shops: shops.map((s) => ({ shopId: s.shopId, lines: s.lines, shippingFee: 0, shopVoucher: pick(s) })), ctx })
  const out = r.shops.map((x, i) => {
    const s = shops[i]
    const missing = x.shopVoucher || !s.lines.length ? [] : s.vouchers
      .map((v) => ineligibility(v, x.goods, { ...ctx, usedByBuyer: usedBy(v) }))
      .flatMap((why) => (why?.kind === 'min_spend' ? [why.missing] : []))
    return { shopId: x.shopId, count: s.lines.length, goods: x.goods, applied: x.shopVoucher, discount: x.shopDiscount, nudge: missing.length ? Math.min(...missing) : undefined }
  })
  return {
    shops: out,
    count: out.reduce((a, s) => a + s.count, 0),
    goods: r.goods,
    shopDiscount: r.shopDiscount,
    total: r.goods - r.shopDiscount,
    savings: r.savings,
  }
}

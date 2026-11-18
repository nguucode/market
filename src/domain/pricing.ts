// The pricing engine: spec/ia/rules.md#voucher-math. Pure; every function here is unit-tested.
import type { PaymentMethod, Voucher } from './types'

/** Split `total` across `weights` pro rata so the parts sum exactly to `total` (largest remainder). */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (total === 0 || sum === 0) return weights.map(() => 0)
  const raw = weights.map((w) => (total * w) / sum)
  const parts = raw.map(Math.floor)
  let rest = total - parts.reduce((a, b) => a + b, 0)
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r), w: weights[i] }))
    .sort((a, b) => b.frac - a.frac || b.w - a.w || a.i - b.i)
  for (const o of order) {
    if (rest <= 0) break
    parts[o.i] += 1
    rest -= 1
  }
  return parts
}

export type VoucherContext = { now: number; paymentMethod?: PaymentMethod; usedByBuyer?: number }

export type Ineligible =
  | { kind: 'min_spend'; missing: number }
  | { kind: 'expired' }
  | { kind: 'not_started' }
  | { kind: 'out_of_quota' }
  | { kind: 'used_up' }
  | { kind: 'payment_method'; methods: PaymentMethod[] }

/** Why a voucher cannot apply to `base` right now, or null when it can. */
export function ineligibility(v: Voucher, base: number, ctx: VoucherContext): Ineligible | null {
  if (ctx.now >= v.endsAt) return { kind: 'expired' }
  if (ctx.now < v.startsAt) return { kind: 'not_started' }
  if (v.usedCount >= v.totalQuota) return { kind: 'out_of_quota' }
  if ((ctx.usedByBuyer ?? 0) >= v.perBuyerLimit) return { kind: 'used_up' }
  if (v.paymentMethods && ctx.paymentMethod && !v.paymentMethods.includes(ctx.paymentMethod))
    return { kind: 'payment_method', methods: v.paymentMethods }
  if (base < v.minSpend) return { kind: 'min_spend', missing: v.minSpend - base }
  return null
}

/** Discount a shop or platform voucher gives on `base` (floor, capped): rules.md#voucher-math item 4. */
export function voucherDiscount(v: Voucher, base: number): number {
  if (base <= 0) return 0
  if (v.kind === 'percent') return Math.min(Math.floor((base * v.value) / 100), v.maxDiscount ?? Infinity, base)
  return Math.min(v.value, base)
}

/** Shipping discount for one shop's fee. */
export function shippingDiscount(v: Voucher, fee: number): number {
  return Math.max(0, Math.min(fee, v.maxPerShop ?? v.value))
}

/** Best eligible voucher: largest discount, ties by earliest expiry. */
export function bestVoucher(
  vouchers: Voucher[],
  base: number,
  ctx: VoucherContext,
  value: (v: Voucher) => number = (v) => voucherDiscount(v, base),
  usedBy: (v: Voucher) => number = () => 0,
): Voucher | undefined {
  return vouchers
    .filter((v) => !ineligibility(v, base, { ...ctx, usedByBuyer: usedBy(v) }))
    .map((v) => ({ v, d: value(v) }))
    .filter((x) => x.d > 0)
    .sort((a, b) => b.d - a.d || a.v.endsAt - b.v.endsAt)[0]?.v
}

export type PricingLine = { id: string; unitPrice: number; qty: number; beforePromo?: number }
export type ShopInput = { shopId: string; lines: PricingLine[]; shippingFee: number; shopVoucher?: Voucher }
export type PricingInput = {
  shops: ShopInput[]
  platformVoucher?: Voucher
  shippingVoucher?: Voucher
  /** P1 Xu: applied after vouchers, capped at 50% of payable (rules.md#voucher-math item 8). */
  coins?: number
  ctx: VoucherContext
}
export type ShopResult = {
  shopId: string
  goods: number
  promoSavings: number
  shopVoucher?: Voucher
  shopDiscount: number
  net: number
  platformShare: number
  shippingFee: number
  shippingDiscount: number
  coinsShare: number
  total: number
}
export type Dropped = { voucher: Voucher; reason: Ineligible }
export type PricingResult = {
  shops: ShopResult[]
  goods: number
  shopDiscount: number
  platformVoucher?: Voucher
  platformDiscount: number
  shippingFee: number
  shippingVoucher?: Voucher
  shippingDiscount: number
  coins: number
  total: number
  /** Promo savings (struck price − price) plus every voucher discount. */
  savings: number
  /** Vouchers the input asked for that no longer apply, with why: rules.md#voucher-math item 6. */
  dropped: Dropped[]
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function price(input: PricingInput): PricingResult {
  const dropped: Dropped[] = []
  const shops = input.shops.map((s) => {
    const goods = sum(s.lines.map((l) => l.unitPrice * l.qty))
    const promoSavings = sum(s.lines.map((l) => Math.max(0, (l.beforePromo ?? l.unitPrice) - l.unitPrice) * l.qty))
    let shopVoucher = s.shopVoucher
    if (shopVoucher) {
      const why = ineligibility(shopVoucher, goods, input.ctx)
      if (why) { dropped.push({ voucher: shopVoucher, reason: why }); shopVoucher = undefined }
    }
    const shopDiscount = shopVoucher ? voucherDiscount(shopVoucher, goods) : 0
    return { shopId: s.shopId, goods, promoSavings, shopVoucher, shopDiscount, net: goods - shopDiscount, shippingFee: s.shippingFee }
  })
  const base = sum(shops.map((s) => s.net))

  let platformVoucher = input.platformVoucher
  if (platformVoucher) {
    const why = ineligibility(platformVoucher, base, input.ctx)
    if (why) { dropped.push({ voucher: platformVoucher, reason: why }); platformVoucher = undefined }
  }
  const platformDiscount = platformVoucher ? voucherDiscount(platformVoucher, base) : 0
  const platformShares = allocate(platformDiscount, shops.map((s) => s.net))

  let shippingVoucher = input.shippingVoucher
  if (shippingVoucher) {
    const why = ineligibility(shippingVoucher, base, input.ctx)
    if (why) { dropped.push({ voucher: shippingVoucher, reason: why }); shippingVoucher = undefined }
  }
  const shipDiscounts = shops.map((s) => (shippingVoucher ? shippingDiscount(shippingVoucher, s.shippingFee) : 0))

  const payables = shops.map((s, i) => s.net - platformShares[i] + s.shippingFee - shipDiscounts[i])
  const payable = sum(payables)
  const coins = Math.max(0, Math.min(input.coins ?? 0, Math.floor(payable * 0.5)))
  const coinShares = allocate(coins, payables)

  const results: ShopResult[] = shops.map((s, i) => ({
    ...s,
    platformShare: platformShares[i],
    shippingDiscount: shipDiscounts[i],
    coinsShare: coinShares[i],
    total: payables[i] - coinShares[i],
  }))
  const shopDiscount = sum(results.map((r) => r.shopDiscount))
  const shippingDisc = sum(shipDiscounts)
  return {
    shops: results,
    goods: sum(results.map((r) => r.goods)),
    shopDiscount,
    platformVoucher,
    platformDiscount,
    shippingFee: sum(results.map((r) => r.shippingFee)),
    shippingVoucher,
    shippingDiscount: shippingDisc,
    coins,
    total: payable - coins,
    savings: sum(results.map((r) => r.promoSavings)) + shopDiscount + platformDiscount + shippingDisc + coins,
    dropped,
  }
}

/** Display name for a voucher: `Giảm 15% tối đa 50K`, `Giảm 30K`, `Miễn phí vận chuyển tối đa 25K`. */
export function voucherLabel(v: Voucher): string {
  const k = (n: number) => (n >= 1_000_000 ? `${String(Math.floor(n / 100_000) / 10).replace('.', ',')}Tr` : `${Math.floor(n / 1000)}K`)
  if (v.scope === 'shipping') return `Miễn phí vận chuyển tối đa ${k(v.maxPerShop ?? v.value)}`
  if (v.kind === 'percent') return `Giảm ${v.value}%${v.maxDiscount ? ` tối đa ${k(v.maxDiscount)}` : ''}`
  return `Giảm ${k(v.value)}`
}

/** One-line reason text for an ineligible voucher. */
export function ineligibleText(r: Ineligible, fmt: (n: number) => string): string {
  switch (r.kind) {
    case 'min_spend': return `Mua thêm ${fmt(r.missing)} để dùng voucher`
    case 'expired': return 'Voucher đã hết hạn'
    case 'not_started': return 'Voucher chưa bắt đầu'
    case 'out_of_quota': return 'Voucher đã hết lượt'
    case 'used_up': return 'Bạn đã dùng hết lượt của voucher này'
    case 'payment_method': return 'Không áp dụng cho phương thức thanh toán đã chọn'
  }
}

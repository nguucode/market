// Mock store: spec/ia/mock-data.md, US-FND-003. Domain state in localStorage `market.state.v1`,
// synced across tabs and the /device frame with BroadcastChannel.
import { useSyncExternalStore } from 'react'
import { AUTO_COMPLETE_DAYS, PAYMENT_LABEL, PAYMENT_MINUTES, RETURN_SHIP_DAYS, refundDestination, refundSplit, STATUS_LABEL } from '@/domain/orders'
import { bestVoucher, ineligibility, price, voucherLabel, type PricingResult } from '@/domain/pricing'
import { vnd } from '@/domain/money'
import { dmy, hm } from '@/domain/time'
import { quoteShipping, type Quote } from '@/domain/shipping'
import type {
  Address, AppliedVoucher, CartLine, Notification, Order, OrderLine, PaymentMethod, Product, ReturnReason, Review, ShippingOption, Shop, Sku, Voucher,
} from '@/domain/types'
import { SEED_VERSION, seedWorld, variantText, type World } from '@/mock/seed'
import catalogSource from '@/mock/data/catalog-source.json'

const DAY = 86_400_000
const HOUR = 3_600_000
const MIN = 60_000

/* ── State ────────────────────────────────────────────────────────── */

export type Settings = {
  latency: 'normal' | 'none' | 'slow'
  nextPayment: 'success' | 'failure' | 'timeout'
  nextPlaceOrder: 'normal' | 'price_changed' | 'out_of_stock'
  clockOffsetMs: number
}
export type State = { world: World; settings: Settings; version: number; seededAt: number; catalog?: string }

/** Fingerprint of the catalogue: saved demo state from an older catalogue is discarded (its product ids may be gone). */
export const CATALOG = ((s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) })(SEED_VERSION + JSON.stringify(catalogSource))

const KEY = 'market.state.v1'
const DEFAULT_SETTINGS: Settings = { latency: 'normal', nextPayment: 'success', nextPlaceOrder: 'normal', clockOffsetMs: 0 }

function fresh(): State {
  const t = Date.now()
  return { world: seedWorld(t), settings: { ...DEFAULT_SETTINGS }, version: 1, seededAt: t, catalog: CATALOG }
}
function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const s = JSON.parse(raw) as State; if (s.catalog === CATALOG) return s }
  } catch { /* storage blocked: fall back to a fresh seed */ }
  return fresh()
}

let state: State = load()
let storageWarned = false
const listeners = new Set<() => void>()
let channel: BroadcastChannel | null = null
try {
  channel = new BroadcastChannel('market')
  channel.onmessage = (e) => { state = e.data as State; listeners.forEach((l) => l()) }
} catch { /* single window only */ }

function commit(next: State) {
  state = { ...next, version: next.version + 1 }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {
    // Quota or private mode: keep working in memory, tell the shell once per session.
    if (!storageWarned) { storageWarned = true; window.dispatchEvent(new Event('market:storage-failed')) }
  }
  channel?.postMessage(state)
  listeners.forEach((l) => l())
}
export function mutate<T>(fn: (w: World, s: Settings) => T): T {
  const draft: State = structuredClone(state)
  const out = fn(draft.world, draft.settings)
  commit(draft)
  return out
}
export const now = () => Date.now() + state.settings.clockOffsetMs
export const getState = () => state
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state))
}
export const useWorld = () => useStore((s) => s.world)
export const useSettings = () => useStore((s) => s.settings)
/** Re-renders every `ms` so countdowns and relative times stay current. */
export function useNow(ms = 60_000) {
  const v = useStore((s) => s.settings.clockOffsetMs)
  const tick = useSyncExternalStore(
    (cb) => { const t = setInterval(cb, ms); return () => clearInterval(t) },
    () => Math.floor(Date.now() / ms),
    () => 0,
  )
  void tick
  return Date.now() + v
}

let latencyTick = 0
/** Simulated network latency, deterministic. */
export function delay(): Promise<void> {
  const l = state.settings.latency
  const ms = l === 'none' ? 0 : l === 'slow' ? 2500 : 250 + ((latencyTick++ * 137) % 450)
  return new Promise((r) => setTimeout(r, ms))
}

export function resetDemo() {
  const s = fresh()
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
  commit({ ...s, version: state.version + 1 })
}

/* ── Lookups ──────────────────────────────────────────────────────── */

export const productById = (w: World, id: string) => w.products.find((p) => p.id === id)
export const productBySlug = (w: World, slug: string) => w.products.find((p) => p.slug === slug)
export const skuById = (w: World, id: string) => w.skus.find((k) => k.id === id)
export const skusOf = (w: World, productId: string) => w.skus.filter((k) => k.productId === productId)
export const shopById = (w: World, id: string) => w.shops.find((s) => s.id === id)!
export const shopByHandle = (w: World, h: string) => w.shops.find((s) => s.handle === h)
export const defaultAddress = (w: World) => w.addresses.find((a) => a.isDefault) ?? w.addresses[0]
export const unreadCount = (w: World) => w.notifications.filter((n) => !n.read).length
export const cartCount = (w: World) => w.cart.length

/** Active flash-sale item for a SKU at `t`, if any. */
export function flashFor(w: World, skuId: string, t: number) {
  const slot = w.flashSlots.find((s) => s.startsAt <= t && t < s.endsAt)
  const item = slot?.items.find((i) => i.skuId === skuId && i.sold < i.quota)
  return item && slot ? { slot, item } : undefined
}

/** Unit price the buyer pays now: flash price inside an active slot (rules.md#price-display). */
export function unitPrice(w: World, k: Sku, t: number) {
  const f = flashFor(w, k.id, t)
  return f ? { price: f.item.salePrice, before: k.priceBeforePromo ?? k.price, flash: f } : { price: k.price, before: k.priceBeforePromo, flash: undefined }
}

export function savedUse(w: World, voucherId: string) {
  return w.savedVouchers.find((s) => s.voucherId === voucherId)?.usedCount ?? 0
}

/* ── Notifications (only for events the buyer did not cause) ───────── */

function notify(w: World, kind: Notification['kind'], title: string, body: string, link?: string) {
  w.notifications.unshift({ id: `n${++w.seq}`, kind, title, body, link, read: false, createdAt: now() })
}
export const markRead = (id: string) => mutate((w) => { const n = w.notifications.find((x) => x.id === id); if (n) n.read = true })
export const markAllRead = (kind?: Notification['kind']) => mutate((w) => { for (const n of w.notifications) if (!kind || n.kind === kind) n.read = true })

/* ── Favourites, follows, search history ──────────────────────────── */

export const toggleFavorite = (productId: string) => mutate((w) => {
  const i = w.favorites.indexOf(productId)
  if (i >= 0) { w.favorites.splice(i, 1); return false }
  w.favorites.unshift(productId); return true
})
export const toggleFollow = (shopId: string) => mutate((w) => {
  const i = w.follows.indexOf(shopId)
  const s = w.shops.find((x) => x.id === shopId)!
  if (i >= 0) { w.follows.splice(i, 1); s.followers -= 1; return false }
  w.follows.unshift(shopId); s.followers += 1; return true
})
export const pushSearch = (q: string) => mutate((w) => {
  const t = q.trim(); if (!t) return
  w.searchHistory = [t, ...w.searchHistory.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 10)
})
export const removeSearch = (q?: string) => mutate((w) => { w.searchHistory = q ? w.searchHistory.filter((x) => x !== q) : [] })

/* ── Vouchers ─────────────────────────────────────────────────────── */

export async function saveVoucher(voucherId: string) {
  await delay()
  return mutate((w) => {
    const v = w.vouchers.find((x) => x.id === voucherId)
    if (!v || v.endsAt <= now() || v.usedCount >= v.totalQuota) return false
    if (!w.savedVouchers.some((s) => s.voucherId === voucherId)) w.savedVouchers.unshift({ voucherId, savedAt: now(), usedCount: 0 })
    return true
  })
}

/* ── Cart ─────────────────────────────────────────────────────────── */

export const MAX_ADDRESSES = 10

export async function addToCart(skuId: string, qty: number): Promise<{ ok: true; lineId: string } | { ok: false; reason: string }> {
  await delay()
  return mutate((w) => {
    const k = w.skus.find((x) => x.id === skuId)
    if (!k || k.stock <= 0) return { ok: false as const, reason: 'Phân loại này đã hết hàng' }
    const existing = w.cart.find((l) => l.skuId === skuId)
    if (existing) {
      existing.qty = Math.min(k.stock, existing.qty + qty)
      existing.selected = true
      return { ok: true as const, lineId: existing.id }
    }
    const id = `cl${++w.seq}`
    w.cart.unshift({ id, skuId, qty: Math.min(qty, k.stock), selected: true, addedAt: now(), priceAtAdd: unitPrice(w, k, now()).price })
    return { ok: true as const, lineId: id }
  })
}
export const setQty = (lineId: string, qty: number) => mutate((w) => {
  const l = w.cart.find((x) => x.id === lineId); const k = l && w.skus.find((x) => x.id === l.skuId)
  if (l && k) l.qty = Math.max(1, Math.min(qty, k.stock))
})
export const setSelected = (lineIds: string[], selected: boolean) => mutate((w) => { for (const l of w.cart) if (lineIds.includes(l.id)) l.selected = selected })
export const removeLines = (lineIds: string[]) => mutate((w) => { w.cart = w.cart.filter((l) => !lineIds.includes(l.id)) })
export const changeSku = (lineId: string, skuId: string, qty: number) => mutate((w) => {
  const l = w.cart.find((x) => x.id === lineId); if (!l) return
  const dup = w.cart.find((x) => x.skuId === skuId && x.id !== lineId)
  const k = w.skus.find((x) => x.id === skuId)!
  if (dup) { dup.qty = Math.min(k.stock, dup.qty + qty); w.cart = w.cart.filter((x) => x.id !== lineId); return }
  l.skuId = skuId; l.qty = Math.min(qty, k.stock); l.priceAtAdd = unitPrice(w, k, now()).price
})
/** Acknowledge a changed price: the line now tracks the current price. */
export const acceptPrice = (lineId: string) => mutate((w) => {
  const l = w.cart.find((x) => x.id === lineId); const k = l && w.skus.find((x) => x.id === l.skuId)
  if (l && k) l.priceAtAdd = unitPrice(w, k, now()).price
})

export type LineView = {
  line: CartLine; sku: Sku; product: Product; shop: Shop; unit: number; before?: number; variant: string
  availability: 'ok' | 'out_of_stock' | 'delisted' | 'qty_reduced'; priceChanged: number; flashCapped: boolean
}
export function lineView(w: World, line: CartLine, t: number): LineView {
  const sku = w.skus.find((k) => k.id === line.skuId)!
  const product = w.products.find((p) => p.id === sku.productId)!
  const shop = w.shops.find((s) => s.id === product.shopId)!
  const u = unitPrice(w, sku, t)
  const availability = product.status === 'delisted' ? 'delisted' : sku.stock <= 0 ? 'out_of_stock' : line.qty > sku.stock ? 'qty_reduced' : 'ok'
  return {
    line, sku, product, shop, unit: u.price, before: u.before, variant: variantText(product, sku), availability,
    priceChanged: u.price - line.priceAtAdd, flashCapped: !!u.flash && line.qty > u.flash.item.perBuyerLimit,
  }
}
export function cartGroups(w: World, t: number) {
  const views = w.cart.map((l) => lineView(w, l, t))
  const available = views.filter((v) => v.availability !== 'delisted' && v.availability !== 'out_of_stock')
  const unavailable = views.filter((v) => !available.includes(v))
  const order: string[] = []
  for (const v of available) if (!order.includes(v.shop.id)) order.push(v.shop.id)
  return { groups: order.map((id) => ({ shop: w.shops.find((s) => s.id === id)!, lines: available.filter((v) => v.shop.id === id) })), unavailable }
}

const flashKey = (slotId: string, skuId: string) => `${slotId}:${skuId}`
/**
 * Whole-đồng price parts for `qty` units: flash units are capped by the per-buyer limit minus what the buyer already
 * bought in this slot, and by the slot's remaining quota; the rest is at the normal price (rules.md#price-display).
 */
export function lineParts(w: World, sku: Sku, qty: number, t: number): { price: number; qty: number; flashSlotId?: string }[] {
  const f = flashFor(w, sku.id, t)
  if (!f) return [{ price: sku.price, qty }]
  const bought = w.flashBought?.[flashKey(f.slot.id, sku.id)] ?? 0
  const n = Math.max(0, Math.min(qty, f.item.perBuyerLimit - bought, f.item.quota - f.item.sold))
  const parts: { price: number; qty: number; flashSlotId?: string }[] = []
  if (n > 0) parts.push({ price: f.item.salePrice, qty: n, flashSlotId: f.slot.id })
  if (qty - n > 0) parts.push({ price: sku.price, qty: qty - n })
  return parts
}
/** Line amount in whole đồng. */
export function lineAmount(v: Pick<LineView, 'unit' | 'sku'> & { line: { qty: number } }, w: World, t: number) {
  return lineParts(w, v.sku, v.line.qty, t).reduce((a, p) => a + p.price * p.qty, 0)
}

/* ── Checkout session (per tab) ───────────────────────────────────── */

const SESSION_KEY = 'market.session.v1'
export type CheckoutDraft = {
  id: string
  source: 'cart' | 'buy_now'
  lines: { skuId: string; qty: number; cartLineId?: string }[]
  addressId?: string
  shipping: Record<string, ShippingOption>
  payment: PaymentMethod
  shopVoucher: Record<string, string | null> // null = buyer removed the auto-applied one
  platformVoucher?: string | null
  shippingVoucher?: string | null
  messages: Record<string, string>
}
type Session = { checkout?: CheckoutDraft; search?: string }
function readSession(): Session {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}') as Session } catch { return {} }
}
let session: Session = readSession()
const sessionListeners = new Set<() => void>()
export function setSession(fn: (s: Session) => void) {
  const next = structuredClone(session); fn(next); session = next
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch { /* ignore */ }
  sessionListeners.forEach((l) => l())
}
export function useSession<T>(select: (s: Session) => T): T {
  return useSyncExternalStore((l) => { sessionListeners.add(l); return () => sessionListeners.delete(l) }, () => select(session), () => select(session))
}

export function startCheckout(source: CheckoutDraft['source'], lines: CheckoutDraft['lines']) {
  setSession((s) => {
    s.checkout = { id: `ck${Date.now()}`, source, lines, shipping: {}, payment: 'cod', shopVoucher: {}, messages: {} }
  })
}
export const updateCheckout = (fn: (d: CheckoutDraft) => void) => setSession((s) => { if (s.checkout) fn(s.checkout) })

export type CheckoutShop = {
  shop: Shop
  lines: { skuId: string; qty: number; cartLineId?: string; sku: Sku; product: Product; unit: number; before?: number; amount: number; variant: string }[]
  quotes: Quote[]
  option: ShippingOption
  quote: Quote
  shopVouchers: Voucher[]
}
export type CheckoutQuote = {
  address?: Address
  shops: CheckoutShop[]
  pricing: PricingResult
  codAllowed: { ok: boolean; reason?: string }
  available: { shop: Voucher[]; platform: Voucher[]; shipping: Voucher[] }
}

/** Everything the checkout page shows, priced by the engine. Auto-applies best vouchers unless the buyer removed them. */
export function quoteCheckout(w: World, d: CheckoutDraft, t: number): CheckoutQuote {
  const address = w.addresses.find((a) => a.id === d.addressId) ?? defaultAddress(w)
  const byShop = new Map<string, CheckoutShop['lines']>()
  for (const l of d.lines) {
    const sku = w.skus.find((k) => k.id === l.skuId)!
    const product = w.products.find((p) => p.id === sku.productId)!
    const u = unitPrice(w, sku, t)
    const amount = lineAmount({ unit: u.price, sku, line: l }, w, t)
    const list = byShop.get(product.shopId) ?? []
    list.push({ ...l, sku, product, unit: u.price, before: u.before, amount, variant: variantText(product, sku) })
    byShop.set(product.shopId, list)
  }
  const saved = new Set(w.savedVouchers.map((s) => s.voucherId))
  const usable = (v: Voucher) => saved.has(v.id) || v.scope === 'shop'
  const shops: CheckoutShop[] = [...byShop].map(([shopId, lines]) => {
    const shop = w.shops.find((s) => s.id === shopId)!
    const weight = lines.reduce((a, l) => a + l.product.weightGrams * l.qty, 0)
    const quotes = address ? quoteShipping(shop.provinceCode, address.provinceCode, weight, t) : quoteShipping(shop.provinceCode, 48, weight, t)
    const option = quotes.some((q) => q.option === d.shipping[shopId]) ? d.shipping[shopId] : 'fast'
    return { shop, lines, quotes, option, quote: quotes.find((q) => q.option === option)!, shopVouchers: w.vouchers.filter((v) => v.scope === 'shop' && v.shopId === shopId && !v.credit) }
  })
  const used = (v: Voucher) => savedUse(w, v.id)
  const ctx = { now: t, paymentMethod: d.payment, usedBy: used }
  const pickShop = (s: CheckoutShop) => {
    const chosen = d.shopVoucher[s.shop.id]
    if (chosen === null) return undefined
    if (chosen) return w.vouchers.find((v) => v.id === chosen)
    const goods = s.lines.reduce((a, l) => a + l.amount, 0)
    return bestVoucher(s.shopVouchers, goods, ctx, undefined, used)
  }
  const shopInputs = shops.map((s) => ({
    shopId: s.shop.id,
    lines: s.lines.flatMap((l) => lineParts(w, l.sku, l.qty, t).map((p, j) => ({ id: `${l.skuId}#${j}`, unitPrice: p.price, qty: p.qty, beforePromo: l.before }))),
    shippingFee: s.quote.fee,
    shopVoucher: pickShop(s),
  }))
  const pre = price({ shops: shopInputs, ctx })
  const base = pre.shops.reduce((a, s) => a + s.net, 0)
  const platformList = w.vouchers.filter((v) => v.scope === 'platform' && usable(v))
  const shippingList = w.vouchers.filter((v) => v.scope === 'shipping' && usable(v))
  const platformVoucher = d.platformVoucher === null ? undefined : d.platformVoucher ? w.vouchers.find((v) => v.id === d.platformVoucher) : bestVoucher(platformList, base, ctx, undefined, used)
  const shippingVoucher = d.shippingVoucher === null ? undefined : d.shippingVoucher ? w.vouchers.find((v) => v.id === d.shippingVoucher) : bestVoucher(shippingList, base, ctx, (v) => shopInputs.reduce((a, s) => a + Math.min(s.shippingFee, v.maxPerShop ?? v.value), 0), used)
  const pricing = price({ shops: shopInputs, platformVoucher, shippingVoucher, ctx })
  const codOff = shops.find((s) => !s.shop.codEnabled)
  const tooBig = pricing.shops.find((s) => s.total > 10_000_000)
  return {
    address, shops, pricing,
    codAllowed: codOff ? { ok: false, reason: `${codOff.shop.name} không nhận thanh toán khi nhận hàng` } : tooBig ? { ok: false, reason: 'Đơn trên 10.000.000₫ không dùng được thanh toán khi nhận hàng' } : { ok: true },
    available: { shop: shops.flatMap((s) => s.shopVouchers), platform: platformList, shipping: shippingList },
  }
}

export type PlaceResult =
  | { ok: true; paymentId: string; orderIds: string[]; method: PaymentMethod }
  | { ok: false; kind: 'changed'; changes: { name: string; text: string }[] }

/** Last-moment checks, then one order per shop: US-CHK-006. */
export async function placeOrder(d: CheckoutDraft, expectedTotal?: number): Promise<PlaceResult> {
  await delay()
  return mutate((w, s) => {
    const t = now()
    // Demo scenario: one-shot change at place-order.
    if (s.nextPlaceOrder !== 'normal') {
      const first = w.skus.find((k) => k.id === d.lines[0].skuId)!
      const p = w.products.find((x) => x.id === first.productId)!
      if (s.nextPlaceOrder === 'price_changed') {
        const old = first.price
        first.price = Math.round((first.price * 1.08) / 1000) * 1000
        s.nextPlaceOrder = 'normal'
        return { ok: false as const, kind: 'changed' as const, changes: [{ name: p.name, text: `Giá thay đổi từ ${old.toLocaleString('vi-VN')}₫ thành ${first.price.toLocaleString('vi-VN')}₫` }] }
      }
      first.stock = 0
      s.nextPlaceOrder = 'normal'
      return { ok: false as const, kind: 'changed' as const, changes: [{ name: p.name, text: 'Phân loại này vừa hết hàng' }] }
    }
    const changes: { name: string; text: string }[] = []
    for (const l of d.lines) {
      const k = w.skus.find((x) => x.id === l.skuId)!
      const p = w.products.find((x) => x.id === k.productId)!
      if (p.status !== 'active') changes.push({ name: p.name, text: 'Sản phẩm đã ngừng bán' })
      else if (k.stock < l.qty) changes.push({ name: p.name, text: k.stock ? `Chỉ còn ${k.stock} sản phẩm` : 'Phân loại này vừa hết hàng' })
    }
    const q = quoteCheckout(w, d, t)
    for (const dr of q.pricing.dropped) changes.push({ name: voucherLabel(dr.voucher), text: 'Voucher không còn áp dụng' })
    if (d.payment === 'cod' && !q.codAllowed.ok) changes.push({ name: PAYMENT_LABEL.cod, text: q.codAllowed.reason ?? 'Không dùng được cho đơn này' })
    if (!changes.length && expectedTotal !== undefined && expectedTotal !== q.pricing.total)
      changes.push({ name: 'Tổng thanh toán', text: `Thay đổi từ ${vnd(expectedTotal)} thành ${vnd(q.pricing.total)}` })
    if (changes.length) return { ok: false as const, kind: 'changed' as const, changes }

    const paymentId = `pay${++w.seq}`
    const address = q.address!
    const orderIds: string[] = []
    q.shops.forEach((cs, i) => {
      const r = q.pricing.shops[i]
      const id = `MK${String(260_000_000_000 + ++w.seq * 7_919_113).padStart(12, '0')}`
      const vouchers: AppliedVoucher[] = []
      if (r.shopVoucher) vouchers.push({ voucherId: r.shopVoucher.id, scope: 'shop', label: voucherLabel(r.shopVoucher), code: r.shopVoucher.code, amount: r.shopDiscount })
      if (q.pricing.platformVoucher && r.platformShare) vouchers.push({ voucherId: q.pricing.platformVoucher.id, scope: 'platform', label: voucherLabel(q.pricing.platformVoucher), code: q.pricing.platformVoucher.code, amount: r.platformShare })
      if (q.pricing.shippingVoucher && r.shippingDiscount) vouchers.push({ voucherId: q.pricing.shippingVoucher.id, scope: 'shipping', label: voucherLabel(q.pricing.shippingVoucher), code: q.pricing.shippingVoucher.code, amount: r.shippingDiscount })
      const lines: OrderLine[] = cs.lines.flatMap((l) => lineParts(w, l.sku, l.qty, t).map((part) => ({
        id: '', productId: l.product.id, skuId: l.sku.id, name: l.product.name, variantText: l.variant,
        image: l.sku.image ?? l.product.images[0], unitPrice: part.price, beforePromo: l.before, qty: part.qty, flashSlotId: part.flashSlotId,
      }))).map((x, j) => ({ ...x, id: `${id}-${j}` }))
      const online = d.payment !== 'cod'
      const order: Order = {
        id, paymentId, shopId: cs.shop.id, lines, status: online ? 'awaiting_payment' : 'to_confirm',
        goods: r.goods, shippingFee: r.shippingFee, shopDiscount: r.shopDiscount, platformDiscount: r.platformShare, shippingDiscount: r.shippingDiscount, total: r.total,
        vouchers, address: structuredClone(address), shippingOption: cs.option, carrier: cs.quote.carrier, eta: cs.quote.eta,
        paymentMethod: d.payment, paymentStatus: 'unpaid', messageToShop: d.messages[cs.shop.id]?.trim() || undefined,
        createdAt: t, at: online ? {} : { to_confirm: t }, trackingCode: `CE${String(100_000_000 + w.seq * 7919).slice(0, 9)}VN`,
      }
      w.orders.unshift(order)
      if (!online) w.tracking.push({ orderId: id, at: t, code: 'to_confirm', text: 'Đơn hàng đã đặt' })
      orderIds.push(id)
      for (const l of lines) {
        const k = w.skus.find((x) => x.id === l.skuId)!; k.stock = Math.max(0, k.stock - l.qty)
        if (l.flashSlotId) {
          const it = w.flashSlots.find((s2) => s2.id === l.flashSlotId)!.items.find((x) => x.skuId === k.id)!
          it.sold = Math.min(it.quota, it.sold + l.qty)
          const key = flashKey(l.flashSlotId, k.id)
          w.flashBought = { ...w.flashBought, [key]: (w.flashBought?.[key] ?? 0) + l.qty }
        }
        const p = w.products.find((x) => x.id === k.productId)!; p.soldCount += l.qty
      }
    })
    for (const v of [...q.pricing.shops.map((r) => r.shopVoucher), q.pricing.platformVoucher, q.pricing.shippingVoucher]) {
      if (!v) continue
      const wv = w.vouchers.find((x) => x.id === v.id)!; wv.usedCount += 1
      const sv = w.savedVouchers.find((x) => x.voucherId === v.id)
      if (sv) sv.usedCount += 1; else w.savedVouchers.push({ voucherId: v.id, savedAt: t, usedCount: 1 })
    }
    w.payments.push({ id: paymentId, orderIds, method: d.payment, amount: q.pricing.total, status: 'pending', createdAt: t, expiresAt: t + PAYMENT_MINUTES * MIN, failures: 0 })
    const cartIds = d.lines.map((l) => l.cartLineId).filter(Boolean) as string[]
    w.cart = w.cart.filter((l) => !cartIds.includes(l.id))
    return { ok: true as const, paymentId, orderIds, method: d.payment }
  })
}

/* ── Payment ──────────────────────────────────────────────────────── */

export const paymentOpen = (w: World, paymentId: string, t: number) => {
  const p = w.payments.find((x) => x.id === paymentId)
  return !!p && p.status !== 'paid' && p.status !== 'expired' && p.status !== 'refunded' && p.method !== 'cod' && t < p.expiresAt
}

/** Mock gateway: the outcome comes from Demo controls (US-CHK-007). */
export async function pay(paymentId: string): Promise<'paid' | 'failed' | 'timeout'> {
  await delay()
  return mutate((w, s) => {
    const p = w.payments.find((x) => x.id === paymentId)!
    if (!paymentOpen(w, paymentId, now())) return 'timeout'
    const outcome = s.nextPayment
    s.nextPayment = 'success'
    if (outcome === 'failure') { p.status = 'failed'; p.failures += 1; return 'failed' }
    if (outcome === 'timeout') { p.status = 'failed'; p.failures += 1; return 'timeout' }
    const t = now()
    p.status = 'paid'
    for (const id of p.orderIds) {
      const o = w.orders.find((x) => x.id === id)!
      if (o.status !== 'awaiting_payment') continue
      o.status = 'to_confirm'; o.paymentStatus = 'paid'; o.at.paid = t; o.at.to_confirm = t
      w.tracking.push({ orderId: o.id, at: t, code: 'paid', text: 'Đã thanh toán' })
      w.tracking.push({ orderId: o.id, at: t, code: 'to_confirm', text: 'Đơn hàng đã đặt' })
    }
    notify(w, 'order', 'Đặt hàng thành công', `Đã thanh toán ${vnd(p.amount)} cho ${p.orderIds.length} đơn hàng.`, `/orders/${p.orderIds[0]}`)
    return 'paid'
  })
}

/** Cancels every unpaid order of an expired payment (system). */
export function expirePayment(paymentId: string) {
  mutate((w) => expireIn(w, paymentId))
}
function expireIn(w: World, paymentId: string) {
  const p = w.payments.find((x) => x.id === paymentId)
  if (!p || p.status === 'paid' || p.status === 'expired') return
  p.status = 'expired'
  const t = now()
  for (const id of p.orderIds) {
    const o = w.orders.find((x) => x.id === id)!
    if (o.status !== 'awaiting_payment') continue
    o.status = 'cancelled'; o.cancelledBy = 'system'; o.cancelReason = 'Quá hạn thanh toán'; o.at.cancelled = t
    w.tracking.push({ orderId: o.id, at: t, code: 'cancelled', text: 'Đơn tự hủy vì quá hạn thanh toán' })
    restock(w, o)
  }
  notify(w, 'order', 'Đơn hàng đã bị hủy', `${p.orderIds.length > 1 ? `${p.orderIds.length} đơn hàng` : `Đơn hàng ${p.orderIds[0]}`} đã bị hủy vì quá hạn thanh toán.`, `/orders/${p.orderIds[0]}`)
}

/** Saved, unused vouchers in their last 24 hours that have not been announced yet (US-NTF-002). */
function expiringVouchers(w: World, t: number) {
  return w.savedVouchers
    .filter((sv) => sv.usedCount === 0 && !(w.expiryNotified ?? []).includes(sv.voucherId))
    .map((sv) => w.vouchers.find((v) => v.id === sv.voucherId)!)
    .filter((v) => v && v.endsAt > t && v.endsAt - t <= DAY)
}
function refundSentence(o: Order) {
  if (!o.refund) return 'Đơn thanh toán khi nhận hàng nên không phát sinh hoàn tiền.'
  return `Số tiền ${vnd(o.refund.amount)} sẽ được hoàn về ${o.refund.to}.`
}
const maskName = (name: string) => { const ch = Array.from(name.replace(/\s+/g, '')); return `${ch[0]}***${ch[ch.length - 1]}` }

/** Time-driven transitions at load and on clock jumps: payment expiry, auto-complete after 15 days. */
export function syncTime() {
  const t = now()
  const w = state.world
  const due = w.payments.some((p) => p.status !== 'paid' && p.status !== 'expired' && p.method !== 'cod' && p.expiresAt <= t && p.orderIds.some((id) => w.orders.find((o) => o.id === id)?.status === 'awaiting_payment')) ||
    w.orders.some((o) => o.status === 'delivered' && (o.at.delivered ?? Infinity) + AUTO_COMPLETE_DAYS * DAY <= t) ||
    expiringVouchers(w, t).length > 0
  if (!due) return
  mutate((ww) => {
    for (const p of ww.payments) if (p.method !== 'cod' && p.expiresAt <= t) expireIn(ww, p.id)
    for (const o of ww.orders) if (o.status === 'delivered' && (o.at.delivered ?? Infinity) + AUTO_COMPLETE_DAYS * DAY <= t) {
      o.status = 'completed'; o.at.completed = t
      notify(ww, 'order', 'Đơn hàng đã hoàn thành', `Đơn hàng ${o.id} đã tự hoàn thành sau ${AUTO_COMPLETE_DAYS} ngày kể từ khi giao.`, `/orders/${o.id}`)
    }
    for (const v of expiringVouchers(ww, t)) {
      ww.expiryNotified = [...(ww.expiryNotified ?? []), v.id]
      notify(ww, 'promotion', 'Voucher sắp hết hạn', `${voucherLabel(v)} sẽ hết hạn lúc ${hm(v.endsAt)} ${dmy(v.endsAt)}.`, `/vouchers?voucher=${v.id}`)
    }
  })
}

/* ── Orders: buyer actions ────────────────────────────────────────── */

function restock(w: World, o: Order) {
  const t = now()
  for (const l of o.lines) {
    const k = w.skus.find((x) => x.id === l.skuId); if (k) k.stock += l.qty
    const p = w.products.find((x) => x.id === l.productId); if (p) p.soldCount = Math.max(0, p.soldCount - l.qty)
    const slot = l.flashSlotId ? w.flashSlots.find((s) => s.id === l.flashSlotId) : undefined
    if (slot && slot.startsAt <= t && t < slot.endsAt) {
      const it = slot.items.find((x) => x.skuId === l.skuId); if (it) it.sold = Math.max(0, it.sold - l.qty)
      const key = flashKey(slot.id, l.skuId)
      if (w.flashBought?.[key]) w.flashBought[key] = Math.max(0, w.flashBought[key] - l.qty)
    }
  }
}
function refundFor(_w: World, o: Order, amount: number) {
  const dest = refundDestination(o.paymentMethod, o.paymentStatus === 'paid')
  if (!dest) return
  o.refund = { amount, to: dest.to, status: 'processing', at: now() }
  o.paymentStatus = 'refunded'
}

/** Immediate cancel (awaiting_payment, to_confirm). An unpaid order cancels every order on its payment. */
export async function cancelOrder(orderId: string, reason: string) {
  await delay()
  return mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    const t = now()
    const targets = o.status === 'awaiting_payment' ? w.orders.filter((x) => x.paymentId === o.paymentId && x.status === 'awaiting_payment') : [o]
    for (const x of targets) {
      x.status = 'cancelled'; x.cancelledBy = 'buyer'; x.cancelReason = reason; x.at.cancelled = t
      w.tracking.push({ orderId: x.id, at: t, code: 'cancelled', text: 'Bạn đã hủy đơn hàng' })
      refundFor(w, x, x.total)
      restock(w, x)
    }
    if (o.paymentStatus === 'unpaid' && targets.length) { const p = w.payments.find((x) => x.id === o.paymentId); if (p && p.status !== 'paid') p.status = 'expired' }
    return targets.map((x) => x.id)
  })
}
export async function requestCancel(orderId: string, reason: string) {
  await delay()
  mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    if (o.cancelRequest) return
    o.cancelRequest = { status: 'pending', reason, at: now() }
    w.tracking.push({ orderId, at: now(), code: 'cancel_requested', text: 'Bạn đã gửi yêu cầu hủy đơn' })
  })
}
export const withdrawCancel = (orderId: string) => mutate((w) => {
  const o = w.orders.find((x) => x.id === orderId)!
  if (o.cancelRequest?.status === 'pending') o.cancelRequest.status = 'withdrawn'
})
export async function confirmReceived(orderId: string) {
  await delay()
  mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    if (o.status !== 'delivered') return
    o.status = 'completed'; o.at.completed = now()
    w.tracking.push({ orderId, at: now(), code: 'completed', text: 'Bạn đã xác nhận đã nhận được hàng' })
  })
}

/** Buy again: adds the order's lines that are still available to the cart. */
export function buyAgain(orderId: string) {
  return mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    let added = 0
    for (const l of o.lines) {
      const k = w.skus.find((x) => x.id === l.skuId)
      const p = k && w.products.find((x) => x.id === k.productId)
      if (!k || !p || p.status !== 'active' || k.stock <= 0) continue
      const ex = w.cart.find((x) => x.skuId === k.id)
      if (ex) { ex.qty = Math.min(k.stock, ex.qty + l.qty); ex.selected = true }
      else w.cart.unshift({ id: `cl${++w.seq}`, skuId: k.id, qty: Math.min(l.qty, k.stock), selected: true, addedAt: now(), priceAtAdd: unitPrice(w, k, now()).price })
      added += 1
    }
    return { added, skipped: o.lines.length - added }
  })
}

/* ── Returns ──────────────────────────────────────────────────────── */

export async function submitReturn(input: { orderId: string; lineIds: string[]; reason: ReturnReason; description: string; photos: string[]; solution: 'refund_only' | 'return_and_refund' }) {
  await delay()
  return mutate((w) => {
    const o = w.orders.find((x) => x.id === input.orderId)!
    const split = refundSplit(o, input.lineIds)
    const dest = refundDestination(o.paymentMethod, o.paymentStatus === 'paid') ?? { to: 'Tài khoản ngân hàng ••••6789', eta: '2 ngày làm việc' }
    const id = `RT${++w.seq}`
    const t = now()
    w.returns.unshift({
      id, orderId: o.id, lineIds: input.lineIds, reason: input.reason, description: input.description, photos: input.photos, solution: input.solution,
      refundTo: dest.to, cash: split.cash, voucherCredit: split.voucherCredit, shippingRefund: split.shipping,
      status: 'submitted', createdAt: t, timeline: [{ status: 'submitted', at: t }],
    })
    o.statusBeforeReturn = o.status; o.status = 'return_requested'; o.returnId = id
    w.tracking.push({ orderId: o.id, at: t, code: 'return_requested', text: 'Bạn đã gửi yêu cầu trả hàng/hoàn tiền' })
    return id
  })
}
export const markReturnShipped = (returnId: string) => mutate((w) => {
  const r = w.returns.find((x) => x.id === returnId)!
  if (r.status !== 'awaiting_return_shipment') return
  r.status = 'returning'; r.timeline.push({ status: 'returning', at: now(), note: 'Bạn đã gửi hàng trả' })
})
export const addReturnEvidence = (returnId: string, photos: string[], note: string) => mutate((w) => {
  const r = w.returns.find((x) => x.id === returnId)!
  if (r.status !== 'needs_evidence') return
  r.photos.push(...photos); r.status = 'under_review'; r.timeline.push({ status: 'under_review', at: now(), note: note || 'Đã bổ sung bằng chứng' })
})

/* ── Reviews ──────────────────────────────────────────────────────── */

export type ReviewInput = { lineId: string; rating: number; sub?: Review['sub']; tags: string[]; text: string; photos: string[]; anonymous: boolean }
export async function submitReviews(orderId: string, inputs: ReviewInput[]) {
  await delay()
  mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    for (const r of inputs) {
      const l = o.lines.find((x) => x.id === r.lineId)!
      if (l.reviewId) continue
      const id = `rm${++w.seq}`
      w.reviews.unshift({
        id, productId: l.productId, skuId: l.skuId, orderId, buyerName: r.anonymous ? maskName(w.buyer.name) : 'Thu Hà', anonymous: r.anonymous, rating: r.rating, sub: r.sub,
        text: r.text.trim(), tags: r.tags, photos: r.photos, createdAt: now(), isMine: true,
      })
      l.reviewId = id
      const p = w.products.find((x) => x.id === l.productId)!
      p.rating = Math.round(((p.rating * p.ratingCount + r.rating) / (p.ratingCount + 1)) * 10) / 10; p.ratingCount += 1
    }
  })
}
export const editReview = (reviewId: string, patch: Pick<Review, 'rating' | 'text' | 'tags' | 'photos'> & Partial<Pick<Review, 'sub'>>) => mutate((w) => {
  const r = w.reviews.find((x) => x.id === reviewId)!
  if (r.editedAt || r.shopReply) return false
  const p = w.products.find((x) => x.id === r.productId)
  if (p && p.ratingCount > 0 && patch.rating !== r.rating) p.rating = Math.round(((p.rating * p.ratingCount - r.rating + patch.rating) / p.ratingCount) * 10) / 10
  Object.assign(r, patch, { editedAt: now() }); return true
})

/* ── Addresses ────────────────────────────────────────────────────── */

export async function saveAddress(a: Omit<Address, 'id'> & { id?: string }) {
  await delay()
  return mutate((w) => {
    let id = a.id
    if (id) Object.assign(w.addresses.find((x) => x.id === id)!, a)
    else { id = `a${++w.seq}`; w.addresses.push({ ...a, id }) }
    if (a.isDefault || w.addresses.length === 1) for (const x of w.addresses) x.isDefault = x.id === id
    return id
  })
}
export const setDefaultAddress = (id: string) => mutate((w) => { for (const x of w.addresses) x.isDefault = x.id === id })
export const removeAddress = (id: string) => mutate((w) => {
  const a = w.addresses.find((x) => x.id === id)
  if (!a || (a.isDefault && w.addresses.length > 1)) return false
  w.addresses = w.addresses.filter((x) => x.id !== id); return true
})

/* ── Demo controls (US-FND-004) ───────────────────────────────────── */

export const setSettings = (patch: Partial<Settings>) => mutate((_w, s) => { Object.assign(s, patch) })

/** Moves an order one step along the happy path, as the shop or carrier would. */
export function advanceOrder(orderId: string) {
  mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    const t = now()
    const shopName = w.shops.find((s) => s.id === o.shopId)!.name
    switch (o.status) {
      case 'awaiting_payment': return expireIn(w, o.paymentId)
      case 'to_confirm':
        o.status = 'to_ship'; o.at.to_ship = t
        w.tracking.push({ orderId, at: t, code: 'to_ship', text: 'Shop đã xác nhận đơn, đang chuẩn bị hàng' })
        return notify(w, 'order', 'Shop đã xác nhận đơn hàng', `Đơn hàng ${orderId} đang được ${shopName} chuẩn bị.`, `/orders/${orderId}`)
      case 'to_ship':
        if (o.cancelRequest?.status === 'pending') {
          o.cancelRequest.status = 'refused'
          w.tracking.push({ orderId, at: t, code: 'cancel_refused', text: 'Shop đã từ chối yêu cầu hủy' })
          notify(w, 'order', 'Shop từ chối yêu cầu hủy đơn', `Đơn hàng ${orderId} sẽ tiếp tục được giao.`, `/orders/${orderId}`)
        }
        o.status = 'shipping'; o.at.picked = t; o.at.shipping = t
        w.tracking.push({ orderId, at: t, code: 'picked', text: 'Đơn vị vận chuyển đã lấy hàng', location: w.shops.find((s) => s.id === o.shopId)!.provinceName })
        return notify(w, 'order', 'Đơn hàng đang được giao', `Đơn hàng ${orderId} đã được giao cho ${o.carrier}. Mã vận đơn ${o.trackingCode}.`, `/orders/${orderId}`)
      case 'shipping':
        o.status = 'delivered'; o.at.delivered = t
        if (o.paymentMethod === 'cod') o.paymentStatus = 'paid'
        w.tracking.push({ orderId, at: t, code: 'delivered', text: 'Giao hàng thành công', location: o.address.provinceName })
        return notify(w, 'order', 'Giao hàng thành công', `Đơn hàng ${orderId} đã được giao. Bấm "Đã nhận được hàng" nếu bạn đã nhận đủ hàng.`, `/orders/${orderId}`)
      case 'delivered':
        o.status = 'completed'; o.at.completed = t
        return notify(w, 'order', 'Đơn hàng đã hoàn thành', `Đơn hàng ${orderId} đã hoàn thành. Bạn có thể đánh giá sản phẩm.`, `/orders/${orderId}`)
    }
  })
}
export function failDelivery(orderId: string) {
  mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    if (o.status !== 'shipping') return
    const t = now()
    o.status = 'cancelled'; o.cancelledBy = 'system'; o.cancelReason = 'Giao hàng không thành công'; o.at.cancelled = t
    w.tracking.push({ orderId, at: t, code: 'cancelled', text: 'Giao hàng không thành công, đơn đã hủy' })
    refundFor(w, o, o.total)
    restock(w, o)
    notify(w, 'order', 'Giao hàng không thành công', `Đơn hàng ${orderId} đã bị hủy vì giao hàng không thành công. ${refundSentence(o)}`, `/orders/${orderId}`)
  })
}
export function respondCancel(orderId: string, accept: boolean) {
  mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    if (o.cancelRequest?.status !== 'pending') return
    const t = now()
    if (accept) {
      o.cancelRequest.status = 'accepted'
      o.status = 'cancelled'; o.cancelledBy = 'shop'; o.cancelReason = o.cancelRequest.reason; o.at.cancelled = t
      w.tracking.push({ orderId, at: t, code: 'cancelled', text: 'Shop đã chấp nhận yêu cầu hủy' })
      refundFor(w, o, o.total); restock(w, o)
      notify(w, 'order', 'Shop đã đồng ý hủy đơn', `Đơn hàng ${orderId} đã được hủy. ${refundSentence(o)}`, `/orders/${orderId}`)
    } else {
      o.cancelRequest.status = 'refused'
      w.tracking.push({ orderId, at: t, code: 'cancel_refused', text: 'Shop đã từ chối yêu cầu hủy' })
      notify(w, 'order', 'Shop từ chối yêu cầu hủy đơn', `Đơn hàng ${orderId} sẽ tiếp tục được giao.`, `/orders/${orderId}`)
    }
  })
}
export function finishRefund(orderId: string) {
  mutate((w) => {
    const o = w.orders.find((x) => x.id === orderId)!
    if (o.refund?.status !== 'processing') return
    o.refund.status = 'done'; o.refund.doneAt = now()
    notify(w, 'order', `Đã hoàn tiền ${vnd(o.refund.amount)}`, `Tiền của đơn hàng ${orderId} đã về ${o.refund.to}.`, `/orders/${orderId}`)
  })
}
export type ReturnDemo = 'approve_refund' | 'approve_return' | 'need_evidence' | 'reject' | 'received' | 'inspected'
export function returnDemo(returnId: string, action: ReturnDemo) {
  mutate((w) => {
    const r = w.returns.find((x) => x.id === returnId)!
    const o = w.orders.find((x) => x.id === r.orderId)!
    const t = now()
    const step = (s: typeof r.status, note?: string) => { r.status = s; r.timeline.push({ status: s, at: t, note }) }
    const done = () => {
      step('refunded')
      o.status = 'returned'
      if (r.voucherCredit > 0) {
        const id = `credit${++w.seq}`
        w.vouchers.push({ id, code: id.toUpperCase(), scope: 'platform', kind: 'amount', value: r.voucherCredit, minSpend: 0, startsAt: t, endsAt: t + 30 * DAY, totalQuota: 1, usedCount: 0, perBuyerLimit: 1, credit: true })
        w.savedVouchers.unshift({ voucherId: id, savedAt: t, usedCount: 0 })
      }
      notify(w, 'order', `Đã hoàn tiền ${vnd(r.cash)}`, `Yêu cầu trả hàng của đơn hàng ${o.id} đã hoàn tiền về ${r.refundTo}.${r.voucherCredit ? ` Voucher Market ${vnd(r.voucherCredit)} đã vào Kho voucher.` : ''}`, `/returns/${r.id}`)
    }
    switch (action) {
      case 'approve_refund': return done()
      case 'approve_return':
        r.returnDeadline = t + RETURN_SHIP_DAYS * DAY
        step('awaiting_return_shipment')
        return notify(w, 'order', 'Yêu cầu trả hàng đã được chấp nhận', `Vui lòng gửi hàng trả trước ${dmy(r.returnDeadline!)}.`, `/returns/${r.id}`)
      case 'need_evidence':
        step('needs_evidence')
        return notify(w, 'order', 'Cần bổ sung bằng chứng', `Yêu cầu trả hàng của đơn hàng ${o.id} cần thêm ảnh.`, `/returns/${r.id}`)
      case 'reject':
        step('rejected'); r.rejectReason = 'Ảnh chưa cho thấy lỗi của sản phẩm'
        o.status = o.statusBeforeReturn ?? 'completed'
        return notify(w, 'order', 'Yêu cầu trả hàng/hoàn tiền bị từ chối', `Yêu cầu của đơn hàng ${o.id} bị từ chối: ${r.rejectReason}.`, `/returns/${r.id}`)
      case 'received': return step('inspecting', 'Kho đã nhận hàng trả')
      case 'inspected': return done()
    }
  })
}
/** Clock jumps (Demo controls). */
export function jumpClock(ms: number) {
  mutate((_w, s) => { s.clockOffsetMs += ms })
  syncTime()
}
export function startNextFlashSlot() {
  const t = now()
  const next = state.world.flashSlots.find((s) => s.startsAt > t)
  if (next) jumpClock(next.startsAt - t + 1000)
}
export function expireVoucher(voucherId: string) {
  mutate((w) => { const v = w.vouchers.find((x) => x.id === voucherId); if (v) v.endsAt = now() - 1 })
}

export { STATUS_LABEL, ineligibility, HOUR }

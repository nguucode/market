// Catalogue selectors shared by cards, search and the product page.
import { discountPct } from '@/domain/money'
import type { Category, Product } from '@/domain/types'
import type { World } from '@/mock/seed'
import { flashFor } from './store'

export type PriceView = { min: number; max: number; before?: number; maxPct: number; flash: boolean; inStock: boolean }

/** Lowest/highest price over a product's SKUs, flash prices included (rules.md#price-display). */
export function priceView(w: World, p: Product, t: number): PriceView {
  const ks = w.skus.filter((k) => k.productId === p.id)
  let min = Infinity, max = 0, before: number | undefined, maxPct = 0, flash = false
  for (const k of ks) {
    const f = flashFor(w, k.id, t)
    const price = f ? f.item.salePrice : k.price
    const b = f ? k.priceBeforePromo ?? k.price : k.priceBeforePromo
    if (f) flash = true
    if (price < min) { min = price; before = b }
    max = Math.max(max, price)
    maxPct = Math.max(maxPct, discountPct(price, b))
  }
  return { min, max, before, maxPct, flash, inStock: ks.some((k) => k.stock > 0) }
}

export type CardLabel = { text: string; tone: 'muted' | 'deal' | 'plain' }
/** One label per card by priority: Hết hàng > Flash sale > -NN% > Shop chính hãng > Freeship. */
export function cardLabel(w: World, p: Product, pv: PriceView): CardLabel | undefined {
  if (!pv.inStock || p.status !== 'active') return { text: 'Hết hàng', tone: 'muted' }
  if (pv.flash) return { text: 'Flash sale', tone: 'deal' }
  if (pv.maxPct > 0) return { text: `-${pv.maxPct}%`, tone: 'deal' }
  if (w.shops.find((s) => s.id === p.shopId)?.isOfficial) return { text: 'Shop chính hãng', tone: 'plain' }
  if (p.freeShipEligible) return { text: 'Freeship', tone: 'plain' }
  return undefined
}

export const categoryById = (w: World, id: string) => w.categories.find((c) => c.id === id)
export const childrenOf = (w: World, id?: string) => w.categories.filter((c) => (id ? c.parentId === id : c.level === 1))
export function ancestry(w: World, id: string): Category[] {
  const out: Category[] = []
  let c = categoryById(w, id)
  while (c) { out.unshift(c); c = c.parentId ? categoryById(w, c.parentId) : undefined }
  return out
}
/** Every level-3 category under `id` (itself when it is level 3). */
export function leavesUnder(w: World, id: string): string[] {
  const c = categoryById(w, id)
  if (!c) return []
  if (c.level === 3) return [c.id]
  return childrenOf(w, c.id).flatMap((x) => leavesUnder(w, x.id))
}
export const activeProducts = (w: World) => w.products.filter((p) => p.status === 'active')

/** Listings of the same source product share their photo set; this is their family key. */
export const siblingKey = (p: Product) => [...p.images].sort().join('|')
/**
 * Keeps listings of the same source product out of the same row of `row` cards (competing shops read as
 * duplication when they sit side by side). Stable: an item moves down only as far as needed.
 */
export function spreadSiblings<T>(items: T[], productOf: (x: T) => Product, row = 5): T[] {
  const out: T[] = []
  const waiting = [...items]
  while (waiting.length) {
    const rowStart = out.length - (out.length % row)
    const inRow = new Set(out.slice(rowStart).map((x) => siblingKey(productOf(x))))
    const i = waiting.findIndex((x) => !inRow.has(siblingKey(productOf(x))))
    out.push(waiting.splice(i === -1 ? 0 : i, 1)[0])
  }
  return out
}

/** Diacritic-insensitive normaliser for search: "dam" matches "Đầm". */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()


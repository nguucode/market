import { spreadSiblings } from '@/app/catalog'
// Pure search, filter, sort and suggest logic: US-DSC-002..006. All state lives in the URL query.
import { categoryById, fold, leavesUnder, priceView } from '@/app/catalog'
import { compactVnd } from '@/domain/money'
import type { Category, Product, Shop } from '@/domain/types'
import type { World } from '@/mock/seed'

/* ── Text ─────────────────────────────────────────────────────────── */

/** NFD, strip marks, đ → d, lower case, collapse spaces. */
export const normalizeVi = (s: string) => fold(s).replace(/\s+/g, ' ').trim()
/** What Enter submits: collapsed whitespace, max 100 characters. */
export const cleanQuery = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 100)
/** "1.200.000" → 1200000; empty → undefined. */
export const parseVndInput = (s: string) => { const d = s.replace(/\D/g, ''); return d ? Number(d) : undefined }
export const groupDigits = (n: number | undefined) => (n === undefined ? '' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))

export const TRENDING = ['bình giữ nhiệt', 'áo khoác nữ', 'tai nghe bluetooth', 'chảo chống dính', 'đầm hoa nhí', 'kính râm', 'son môi', 'giày sneaker']

/* ── Query params ─────────────────────────────────────────────────── */

export type Sort = 'relevance' | 'popular' | 'newest' | 'bestselling' | 'price_asc' | 'price_desc'
export const SORT_LABEL: Record<Sort, string> = {
  relevance: 'Liên quan', popular: 'Phổ biến', newest: 'Mới nhất', bestselling: 'Bán chạy', price_asc: 'Giá: Thấp đến Cao', price_desc: 'Giá: Cao đến Thấp',
}
export const SEARCH_SORTS: Sort[] = ['relevance', 'newest', 'bestselling', 'price_asc', 'price_desc']

export type Flag = 'sale' | 'freeship' | 'voucher' | 'official' | 'cod'
export type SearchParams = {
  q?: string
  cat?: string // category slug
  price_min?: number
  price_max?: number
  rating?: 4
  location?: string[] // province codes, or "foreign"
  sale?: boolean; freeship?: boolean; voucher?: boolean; official?: boolean; cod?: boolean
  sort?: Sort
  page?: number
}
const FLAGS: Flag[] = ['official', 'freeship', 'sale', 'voucher', 'cod']
/** Stable key order (sitemap.yaml search.query). */
const ORDER = ['q', 'cat', 'price_min', 'price_max', 'rating', 'location', 'official', 'freeship', 'sale', 'voucher', 'cod', 'sort', 'page'] as const

const posInt = (s: string | null) => (s && /^\d+$/.test(s) && Number(s) > 0 ? Number(s) : undefined)

/** Invalid values are dropped; `valid` restricts `cat` slugs and `location` codes when given. */
export function parseSearchParams(qs: URLSearchParams, valid: { cats?: Set<string>; provinces?: Set<string>; sorts?: Sort[] } = {}): SearchParams {
  const p: SearchParams = {}
  const q = cleanQuery(qs.get('q') ?? ''); if (q) p.q = q
  const cat = qs.get('cat'); if (cat && (!valid.cats || valid.cats.has(cat))) p.cat = cat
  p.price_min = posInt(qs.get('price_min')); p.price_max = posInt(qs.get('price_max'))
  if (qs.get('rating') === '4') p.rating = 4
  const loc = (qs.get('location') ?? '').split(',').filter((c) => c && (!valid.provinces || valid.provinces.has(c)))
  if (loc.length) p.location = [...new Set(loc)]
  for (const f of FLAGS) if (qs.get(f) === '1') p[f] = true
  const sort = qs.get('sort') as Sort | null
  if (sort && (valid.sorts ?? SEARCH_SORTS).includes(sort)) p.sort = sort
  const page = posInt(qs.get('page')); if (page && page > 1) p.page = page
  for (const k of Object.keys(p) as (keyof SearchParams)[]) if (p[k] === undefined) delete p[k]
  return p
}

export function serializeSearchParams(p: SearchParams, omit: (keyof SearchParams)[] = []): URLSearchParams {
  const out = new URLSearchParams()
  for (const k of ORDER) {
    const v = p[k]
    if (v === undefined || v === false || omit.includes(k)) continue
    if (k === 'page' && v === 1) continue
    out.set(k, Array.isArray(v) ? v.join(',') : v === true ? '1' : String(v))
  }
  return out
}

export const hasFilters = (p: SearchParams, ignoreCat = false) =>
  !!(p.price_min || p.price_max || p.rating || p.location?.length || FLAGS.some((f) => p[f]) || (!ignoreCat && p.cat))
export const activeFilterCount = (p: SearchParams, ignoreCat = false) =>
  (p.price_min || p.price_max ? 1 : 0) + (p.rating ? 1 : 0) + (p.location?.length ?? 0) + FLAGS.filter((f) => p[f]).length + (!ignoreCat && p.cat ? 1 : 0)
/** Drop every filter, keep q and sort ("Xóa bộ lọc"). */
export const clearFilters = (p: SearchParams): SearchParams => ({ q: p.q, sort: p.sort })

export function priceChipLabel(min?: number, max?: number) {
  if (min && max) return `${compactVnd(min)} – ${compactVnd(max)}`
  if (max) return `Dưới ${compactVnd(max)}`
  return `Trên ${compactVnd(min!)}`
}
export const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Dưới 100K', max: 100_000 }, { label: '100K – 300K', min: 100_000, max: 300_000 },
  { label: '300K – 500K', min: 300_000, max: 500_000 }, { label: 'Trên 500K', min: 500_000 },
]

/* ── Index: one row per active product with derived facts ──────────── */

export type Row = {
  p: Product
  shop: Shop
  price: number // lowest current price (flash inside a slot)
  sale: boolean
  inStock: boolean
  voucher: boolean
  loc: string // province code or "foreign"
  text: { name: string; cat: string; shop: string }
}

export function liveShopVoucherIds(w: World, t: number) {
  return new Set(w.vouchers.filter((v) => v.scope === 'shop' && !v.credit && v.startsAt <= t && t < v.endsAt && v.usedCount < v.totalQuota).map((v) => v.shopId!))
}

/** Delisted products never appear. */
export function buildIndex(w: World, t: number): Row[] {
  const withVoucher = liveShopVoucherIds(w, t)
  const shops = new Map(w.shops.map((s) => [s.id, s]))
  return w.products.filter((p) => p.status === 'active').map((p) => {
    const pv = priceView(w, p, t)
    const shop = shops.get(p.shopId)!
    return {
      p, shop, price: pv.min, sale: pv.maxPct > 0 || pv.flash, inStock: pv.inStock, voucher: withVoucher.has(shop.id),
      loc: String(shop.provinceCode),
      text: { name: normalizeVi(p.name), cat: normalizeVi(categoryById(w, p.categoryId)?.name ?? ''), shop: normalizeVi(shop.name) },
    }
  })
}

/* ── Filter ───────────────────────────────────────────────────────── */

type Except = 'cat' | 'location' | Flag | 'rating' | 'price'
function passes(r: Row, p: SearchParams, leaves: Set<string> | null, except?: Except) {
  if (leaves && except !== 'cat' && !leaves.has(r.p.categoryId)) return false
  if (except !== 'price' && p.price_min && r.price < p.price_min) return false
  if (except !== 'price' && p.price_max && r.price > p.price_max) return false
  if (except !== 'rating' && p.rating && r.p.rating < p.rating) return false
  if (except !== 'location' && p.location?.length && !p.location.includes(r.loc)) return false
  if (except !== 'sale' && p.sale && !r.sale) return false
  if (except !== 'freeship' && p.freeship && !r.p.freeShipEligible) return false
  if (except !== 'voucher' && p.voucher && !r.voucher) return false
  if (except !== 'official' && p.official && !r.shop.isOfficial) return false
  if (except !== 'cod' && p.cod && !r.shop.codEnabled) return false
  return true
}
const leafSet = (w: World, slug?: string) => {
  const c = slug ? w.categories.find((x) => x.slug === slug) : undefined
  return c ? new Set(leavesUnder(w, c.id)) : null
}

/** Score > 0 when every query word matches the name, category or shop (name tokens weigh most). */
export function matchScore(r: Row, qn: string): number {
  if (!qn) return 1
  let score = r.text.name.includes(qn) ? 10 : 0
  for (const tok of qn.split(' ')) {
    const s = r.text.name.includes(tok) ? 3 : r.text.cat.includes(tok) ? 2 : r.text.shop.includes(tok) ? 1 : 0
    if (!s) return 0
    score += s
  }
  return score
}

export function applyFilters(w: World, rows: Row[], p: SearchParams, except?: Except): Row[] {
  const leaves = leafSet(w, p.cat)
  return rows.filter((r) => passes(r, p, leaves, except))
}

/* ── Sort and page ────────────────────────────────────────────────── */

const byId = (a: Row, b: Row) => (a.p.id < b.p.id ? -1 : a.p.id > b.p.id ? 1 : 0)
export const popularity = (p: Product) => p.soldCount * p.rating

export function sortRows(rows: Row[], sort: Sort, scores?: Map<string, number>): Row[] {
  const cmp: Record<Sort, (a: Row, b: Row) => number> = {
    relevance: (a, b) => Number(b.inStock) - Number(a.inStock) || (scores?.get(b.p.id) ?? 0) - (scores?.get(a.p.id) ?? 0) || popularity(b.p) - popularity(a.p),
    popular: (a, b) => Number(b.inStock) - Number(a.inStock) || popularity(b.p) - popularity(a.p),
    newest: (a, b) => b.p.createdAt - a.p.createdAt,
    bestselling: (a, b) => b.p.soldCount - a.p.soldCount,
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
  }
  return [...rows].sort((a, b) => cmp[sort](a, b) || byId(a, b))
}

export function paginate<T>(items: T[], page = 1, size = 40) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const p = Math.min(Math.max(1, page), pages)
  return { items: items.slice((p - 1) * size, p * size), page: p, pages }
}

/** "‹ 1 2 3 … 32 ›": first, last, current ±1, gaps as "…". */
export function pageList(cur: number, total: number): (number | '…')[] {
  const keep = new Set([1, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total))
  if (cur <= 3) [2, 3].forEach((n) => n <= total && keep.add(n))
  if (cur >= total - 2) [total - 1, total - 2].forEach((n) => n >= 1 && keep.add(n))
  const out: (number | '…')[] = []
  let prev = 0
  for (const n of [...keep].sort((a, b) => a - b)) { if (n - prev > 1) out.push('…'); out.push(n); prev = n }
  return out
}

/** Matching rows for q + filters, sorted. Default sort is "Liên quan". */
export function searchProducts(w: World, rows: Row[], p: SearchParams): Row[] {
  const qn = normalizeVi(p.q ?? '')
  const scores = new Map<string, number>()
  const hits = applyFilters(w, rows, p).filter((r) => { const s = matchScore(r, qn); if (s) scores.set(r.p.id, s); return s > 0 })
  return spreadSiblings(sortRows(hits, p.sort ?? 'relevance', scores), (r) => r.p)
}
export const queryRows = (rows: Row[], q?: string) => { const qn = normalizeVi(q ?? ''); return rows.filter((r) => matchScore(r, qn) > 0) }

/* ── Facets (each counted with every other facet applied) ──────────── */

export type Facets = {
  cats: { cat: Category; n: number }[]
  locations: { code: string; name: string; n: number }[]
  flags: Record<Flag | 'rating', number>
}
export function facetCounts(w: World, rows: Row[], p: SearchParams, scopeSlug?: string): Facets {
  const base = queryRows(rows, p.q)
  const scope = leafSet(w, scopeSlug)
  const inScope = scope ? base.filter((r) => scope.has(r.p.categoryId)) : base
  const count = (except?: Except, extra: Partial<SearchParams> = {}) => applyFilters(w, inScope, { ...p, ...extra }, except)

  const catCount = new Map<string, number>()
  for (const r of count('cat')) catCount.set(r.p.categoryId, (catCount.get(r.p.categoryId) ?? 0) + 1)
  const catIds = new Set(inScope.map((r) => r.p.categoryId))
  const sel = p.cat ? w.categories.find((c) => c.slug === p.cat) : undefined
  if (sel?.level === 3) catIds.add(sel.id)
  const cats = [...catIds].map((id) => ({ cat: categoryById(w, id)!, n: catCount.get(id) ?? 0 })).sort((a, b) => b.n - a.n || a.cat.name.localeCompare(b.cat.name, 'vi'))

  const locCount = new Map<string, number>()
  for (const r of count('location')) locCount.set(r.loc, (locCount.get(r.loc) ?? 0) + 1)
  const locs = new Map(inScope.map((r) => [r.loc, r.shop.provinceName]))
  for (const c of p.location ?? []) if (!locs.has(c)) locs.set(c, c === 'foreign' ? 'Nước ngoài' : (w.shops.find((s) => String(s.provinceCode) === c)?.provinceName ?? c))
  const locations = [...locs].map(([code, name]) => ({ code, name, n: locCount.get(code) ?? 0 })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'vi'))

  const flags = {} as Facets['flags']
  for (const f of FLAGS) flags[f] = count(undefined, { [f]: true }).length
  flags.rating = count(undefined, { rating: 4 }).length
  return { cats, locations, flags }
}

/* ── Shop match, top selling, suggestions ──────────────────────────── */

/** Best shop whose name or handle contains the query as whole words; exact name first, then followers. */
export function matchShop(shops: Shop[], q: string): Shop | null {
  const qn = normalizeVi(q)
  if (!qn) return null
  const hit = (s: string) => ` ${normalizeVi(s).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ')} `.includes(` ${qn} `)
  const list = shops.filter((s) => hit(s.name) || hit(s.handle.replace(/-/g, ' ')))
  return list.sort((a, b) => Number(normalizeVi(b.name) === qn) - Number(normalizeVi(a.name) === qn) || b.followers - a.followers)[0] ?? null
}

/** Top `n` by soldCount within the category ids; ties by rating then id. */
export function topSelling(products: Product[], ids: Set<string>, n: number): Product[] {
  return products.filter((p) => p.status === 'active' && ids.has(p.categoryId))
    .sort((a, b) => b.soldCount - a.soldCount || b.rating - a.rating || (a.id < b.id ? -1 : 1)).slice(0, n)
}

export type Suggestion =
  | { kind: 'term'; term: string; at: number }
  | { kind: 'scoped'; term: string; cat: Category }
  | { kind: 'shop'; shop: Shop; at: number }

/** Lower-case NFC, per-character fold: same length as the input so a match index maps back for bolding. */
const foldSameLength = (s: string) => [...s.normalize('NFC').toLowerCase()].map((c) => fold(c)[0] ?? c).join('')

/** Search terms: level-3 category names and product names without tags or the part after a comma. */
export function suggestionTerms(w: World): string[] {
  const t = new Set<string>()
  for (const c of w.categories) if (c.level === 3) t.add(c.name.toLowerCase())
  for (const p of w.products) if (p.status === 'active') {
    const n = p.name.replace(/\[[^\]]*\]/g, '').split(/[,(]/)[0].trim().toLowerCase()
    if (n) t.add(n.split(' ').slice(0, 6).join(' '))
  }
  return [...t]
}

export function suggest(w: World, rows: Row[], terms: string[], query: string, limit = 8): Suggestion[] {
  const qn = foldSameLength(query.replace(/\s+/g, ' ').trim())
  if (!qn) return []
  const hits = terms.map((term) => ({ term, at: foldSameLength(term).indexOf(qn) })).filter((h) => h.at >= 0)
    .sort((a, b) => Number(b.at === 0) - Number(a.at === 0) || a.term.length - b.term.length || a.term.localeCompare(b.term, 'vi'))
  const shop = matchShopLoose(w.shops, qn)
  let scoped: Suggestion | undefined
  if (hits[0]) {
    const matches = queryRows(rows, hits[0].term)
    const by = new Map<string, number>()
    for (const r of matches) by.set(r.p.categoryId, (by.get(r.p.categoryId) ?? 0) + 1)
    const [top] = [...by].sort((a, b) => b[1] - a[1])
    if (top && top[1] * 2 > matches.length) scoped = { kind: 'scoped', term: hits[0].term, cat: categoryById(w, top[0])! }
  }
  const out: Suggestion[] = hits.slice(0, limit - (shop ? 1 : 0) - (scoped ? 1 : 0)).map((h) => ({ kind: 'term', term: h.term, at: h.at }))
  if (scoped && out.length) out.splice(1, 0, scoped)
  if (shop) out.push(shop)
  return out
}
function matchShopLoose(shops: Shop[], qn: string): Suggestion | undefined {
  for (const s of shops) { const at = foldSameLength(s.name).indexOf(qn); if (at >= 0 && qn.length >= 2) return { kind: 'shop', shop: s, at } }
}

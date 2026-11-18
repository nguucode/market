import { describe, expect, it } from 'vitest'
import { seedWorld } from '@/mock/seed'
import {
  activeFilterCount, buildIndex, cleanQuery, clearFilters, facetCounts, matchShop, normalizeVi, pageList, paginate, parseSearchParams, parseVndInput,
  priceChipLabel, searchProducts, serializeSearchParams, sortRows, suggest, suggestionTerms, topSelling,
} from './search'

const t = Date.now()
const w = seedWorld(t)
const rows = buildIndex(w, t)
const qs = (s: string) => new URLSearchParams(s)

describe('text', () => {
  it('normalizes Vietnamese', () => {
    expect(normalizeVi('  Bình   GIỮ nhiệt  Đà ')).toBe('binh giu nhiet da')
    expect(cleanQuery('  a   b ' + 'x'.repeat(200))).toHaveLength(100)
    expect(parseVndInput('1.200.000')).toBe(1_200_000)
    expect(parseVndInput('abc')).toBeUndefined()
  })
  it('labels price chips compactly', () => {
    expect(priceChipLabel(1_200_000, 12_500_000)).toBe('1,2Tr – 12,5Tr')
    expect(priceChipLabel(undefined, 100_000)).toBe('Dưới 100K')
    expect(priceChipLabel(500_000)).toBe('Trên 500K')
  })
})

describe('params', () => {
  it('round-trips with stable key order and drops invalid values', () => {
    const p = parseSearchParams(qs('sort=price_asc&q=bình&rating=9&price_min=abc&price_max=300000&location=48,999&official=1&cod=0&page=1'), { provinces: new Set(['48']) })
    expect(p).toEqual({ q: 'bình', price_max: 300000, location: ['48'], official: true, sort: 'price_asc' })
    expect(serializeSearchParams(p).toString()).toBe('q=b%C3%ACnh&price_max=300000&location=48&official=1&sort=price_asc')
    expect(parseSearchParams(serializeSearchParams(p))).toEqual(p)
  })
  it('counts and clears filters, keeping q and sort', () => {
    const p = parseSearchParams(qs('q=a&location=1,48&sale=1&price_min=100000&sort=newest'))
    expect(activeFilterCount(p)).toBe(4)
    expect(clearFilters(p)).toEqual({ q: 'a', sort: 'newest' })
  })
})

describe('search', () => {
  it('matches ignoring diacritics and case', () => {
    const a = searchProducts(w, rows, { q: 'chao' }).map((r) => r.p.id)
    const b = searchProducts(w, rows, { q: 'CHẢO' }).map((r) => r.p.id)
    expect(a.length).toBeGreaterThan(0)
    expect(a).toEqual(b)
  })
  it('never returns delisted products', () => {
    expect(rows.every((r) => r.p.status === 'active')).toBe(true)
  })
  it('filters by price on the lowest current price', () => {
    const r = searchProducts(w, rows, { price_min: 100_000, price_max: 300_000 })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((x) => x.price >= 100_000 && x.price <= 300_000)).toBe(true)
  })
  it('filters by flags and location', () => {
    expect(searchProducts(w, rows, { official: true, cod: true }).every((r) => r.shop.isOfficial && r.shop.codEnabled)).toBe(true)
    expect(searchProducts(w, rows, { location: ['48'] }).every((r) => r.shop.provinceCode === 48)).toBe(true)
    expect(searchProducts(w, rows, { rating: 4 }).every((r) => r.p.rating >= 4)).toBe(true)
  })
  it('scopes by category subtree', () => {
    const r = searchProducts(w, rows, { cat: 'do-bep' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((x) => ['do-bep'].includes(w.categories.find((c) => c.id === w.categories.find((k) => k.id === x.p.categoryId)!.parentId)!.parentId!))).toBe(true)
  })
  it('sorts by price with id tie-break, so paging never skips', () => {
    const asc = sortRows(rows, 'price_asc')
    for (let i = 1; i < asc.length; i++) expect(asc[i].price).toBeGreaterThanOrEqual(asc[i - 1].price)
    const best = sortRows(rows, 'bestselling')
    const pages = [1, 2, 3, 4, 5, 6].flatMap((n) => paginate(best, n).items.map((r) => r.p.id))
    expect(new Set(pages).size).toBe(Math.min(rows.length, 240))
  })
  it('puts out-of-stock last within relevance only', () => {
    const r = sortRows(rows, 'relevance')
    const firstOut = r.findIndex((x) => !x.inStock)
    if (firstOut >= 0) expect(r.slice(firstOut).every((x) => !x.inStock)).toBe(true)
  })
})

describe('paging', () => {
  it('clamps', () => {
    expect(paginate([1, 2, 3], 9, 2)).toEqual({ items: [3], page: 2, pages: 2 })
    expect(paginate([], 1).pages).toBe(1)
  })
  it('lists pages with gaps', () => {
    expect(pageList(1, 32)).toEqual([1, 2, 3, '…', 32])
    expect(pageList(10, 32)).toEqual([1, '…', 9, 10, 11, '…', 32])
    expect(pageList(32, 32)).toEqual([1, '…', 30, 31, 32])
    expect(pageList(1, 1)).toEqual([1])
  })
})

describe('facets', () => {
  it('counts each facet with the others applied', () => {
    const f = facetCounts(w, rows, { official: true })
    const official = searchProducts(w, rows, { official: true })
    expect(f.locations.reduce((a, l) => a + l.n, 0)).toBe(official.length)
    expect(f.flags.official).toBe(official.length)
    expect(f.flags.sale).toBe(searchProducts(w, rows, { official: true, sale: true }).length)
  })
  it('keeps a selected location listed even at zero', () => {
    const f = facetCounts(w, rows, { location: ['foreign'] })
    expect(f.locations.find((l) => l.code === 'foreign')).toMatchObject({ name: 'Nước ngoài', n: 0 })
  })
})

describe('shop match and suggestions', () => {
  it('matches whole words, best by exact name then followers', () => {
    expect(matchShop(w.shops, 'gốm')?.handle).toBe('gom-men-lam')
    expect(matchShop(w.shops, 'zzqx')).toBeNull()
    expect(matchShop(w.shops, 'bep viet official')?.handle).toBe('bep-viet-official')
  })
  it('suggests terms diacritic-insensitively with a scoped row and at most 8 rows', () => {
    const terms = suggestionTerms(w)
    const s = suggest(w, rows, terms, 'chao')
    expect(s.length).toBeGreaterThan(0)
    expect(s.length).toBeLessThanOrEqual(8)
    const first = s[0]
    expect(first.kind).toBe('term')
    if (first.kind === 'term') expect(normalizeVi(first.term)).toContain('chao')
    expect(suggest(w, rows, terms, '   ')).toEqual([])
  })
  it('picks the top sellers with a stable order', () => {
    const ids = new Set(w.categories.filter((c) => c.level === 3).map((c) => c.id))
    const top = topSelling(w.products, ids, 10)
    expect(top).toHaveLength(10)
    for (let i = 1; i < top.length; i++) expect(top[i].soldCount).toBeLessThanOrEqual(top[i - 1].soldCount)
  })
})

import { describe, expect, test } from 'vitest'
import type { Product } from '@/domain/types'
import { seedWorld } from '@/mock/seed'
import { autoLoadAllowed, categoryTiles, HERO, pickMosaic, RAILS, railProducts, recommendationPage } from './home'

const t = Date.now()
const w = seedWorld(t)
const prod = (id: string, status: Product['status'] = 'active') => ({ ...w.products[0], id, status })

describe('pickMosaic', () => {
  test('skips delisted and missing, tops up from fallbacks', () => {
    const ps = [prod('a'), prod('b', 'delisted'), prod('c'), prod('f1'), prod('f2')]
    expect(pickMosaic(['a', 'b', 'missing'], ['f1', 'f2'], ps).map((p) => p.id)).toEqual(['a', 'f1', 'f2'])
  })
  test('seed hero resolves to 6 kitchen products', () => {
    const m = pickMosaic(HERO.mosaic, HERO.fallbacks, w.products)
    expect(m).toHaveLength(6)
    expect(m.every((p) => p.status === 'active' && p.images.length > 0)).toBe(true)
  })
  test('one mosaic product delisted → fallback fills in', () => {
    const ps = w.products.map((p) => (p.id === HERO.mosaic[1] ? { ...p, status: 'delisted' as const } : p))
    const m = pickMosaic(HERO.mosaic, HERO.fallbacks, ps)
    expect(m.map((p) => p.id)).not.toContain(HERO.mosaic[1])
    expect(m[5].id).toBe(HERO.fallbacks[0])
  })
})

test('category tiles: every level-1 category with a photo', () => {
  const tiles = categoryTiles(w)
  expect(tiles.length).toBeGreaterThanOrEqual(9)
  expect(tiles.every((x) => x.category.level === 1 && x.image)).toBe(true)
})

test('rails: up to 12 matches, active, within the price cap', () => {
  for (const def of RAILS) {
    const ps = railProducts(w, def, t)
    expect(ps.length === 0 || ps.length >= 4).toBe(true)
    expect(ps.length).toBeLessThanOrEqual(12)
    expect(ps.every((p) => p.status === 'active')).toBe(true)
  }
  expect(railProducts(w, RAILS[0], t).length).toBeGreaterThanOrEqual(4)
  expect(railProducts(w, { title: 'x', href: '/', cat: 'do-bep', priceMax: 1 }, t)).toEqual([])
})

describe('recommendationPage', () => {
  const ps = [prod('a'), prod('b'), prod('a'), prod('x', 'delisted'), prod('c'), prod('d'), prod('e')]
  test('excludes, dedupes, pages and reports hasMore', () => {
    expect(recommendationPage(ps, new Set(['b']), 0, 2)).toEqual({ items: [ps[0], ps[4]], hasMore: true })
    expect(recommendationPage(ps, new Set(['b']), 1, 2)).toEqual({ items: [ps[5], ps[6]], hasMore: false })
    expect(recommendationPage(ps, new Set(['b']), 2, 2)).toEqual({ items: [], hasMore: false })
  })
})

test('autoLoadAllowed stops after 3 pages', () => {
  expect(autoLoadAllowed(2)).toBe(true)
  expect(autoLoadAllowed(3)).toBe(false)
})

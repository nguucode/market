import type { Product } from '@/domain/types'
import { spreadSiblings } from './catalog'

const p = (id: string, img: string) => ({ id, images: [img] }) as unknown as Product

test('siblings end up at least 6 apart, so no shared row or column-neighbour at 2–5 columns', () => {
  const list = [p('a', 'x'), p('a2', 'x'), ...'bcdefgh'.split('').map((c) => p(c, c)), p('b2', 'b')]
  const out = spreadSiblings(list, (q) => q).map((q) => q.id)
  expect(out.slice(0, 3)).toEqual(['a', 'b', 'c'])
  const at = (id: string) => out.indexOf(id)
  expect(at('a2') - at('a')).toBeGreaterThanOrEqual(6)
  expect(at('b2') - at('b')).toBeGreaterThanOrEqual(6)
  for (const cols of [2, 3, 4, 5]) {
    for (const [x, y] of [['a', 'a2'], ['b', 'b2']]) {
      const d = at(y) - at(x)
      expect(d === cols).toBe(false) // never directly below
    }
  }
})

test('falls back to order when nothing else is left', () => {
  expect(spreadSiblings([p('a', 'x'), p('a2', 'x')], (q) => q).map((q) => q.id)).toEqual(['a', 'a2'])
})

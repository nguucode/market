import type { Product } from '@/domain/types'
import { spreadSiblings } from './catalog'

const p = (id: string, img: string) => ({ id, images: [img] }) as unknown as Product

test('siblings never share a row, order otherwise kept', () => {
  const list = [p('a', 'x'), p('a2', 'x'), p('b', 'y'), p('b2', 'y'), p('c', 'z'), p('d', 'w')]
  const out = spreadSiblings(list, (q) => q, 3).map((q) => q.id)
  expect(out).toEqual(['a', 'b', 'c', 'a2', 'b2', 'd'])
  expect(spreadSiblings([p('a', 'x'), p('a2', 'x')], (q) => q, 5).map((q) => q.id)).toEqual(['a', 'a2'])
})

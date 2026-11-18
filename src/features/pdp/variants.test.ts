import { describe, expect, it } from 'vitest'
import type { Sku, VariantDimension } from '@/domain/types'
import { availableOptions, galleryImageFor, optionState, resolveSku, toggle } from './variants'

const dims: VariantDimension[] = [
  { id: 'color', name: 'Màu', options: [{ id: 'c1', label: 'Đen', image: 'black.jpg' }, { id: 'c2', label: 'Trắng' }, { id: 'c3', label: 'Đỏ' }] },
  { id: 'size', name: 'Kích cỡ', options: [{ id: 's1', label: 'S' }, { id: 's2', label: 'M' }] },
]
const sku = (id: string, optionIds: string[], stock: number): Sku => ({ id, productId: 'p', optionIds, price: 100, stock })
const skus = [sku('a', ['c1', 's1'], 5), sku('b', ['c1', 's2'], 0), sku('c', ['c2', 's1'], 2), sku('d', ['c2', 's2'], 7), sku('e', ['c3', 's1'], 0), sku('f', ['c3', 's2'], 0)]

describe('variants', () => {
  it('resolves only a complete selection', () => {
    expect(resolveSku(skus, ['c1', null])).toBeNull()
    expect(resolveSku(skus, ['c2', 's2'])?.id).toBe('d')
  })
  it('treats zero dimensions as the single SKU', () => {
    expect(resolveSku([sku('only', [], 3)], [])?.id).toBe('only')
  })
  it('disables an option with no stock anywhere from the start', () => {
    const s = availableOptions(dims, skus, [null, null])
    expect(s[0].map((o) => o.enabled)).toEqual([true, true, false])
    expect(s[1].map((o) => o.stock)).toEqual([7, 7])
  })
  it('disables combinations with stock 0 given the other pick', () => {
    expect(optionState(skus, ['c1', null], 1, 's2')).toEqual({ enabled: false, stock: 0 })
    expect(optionState(skus, ['c1', null], 1, 's1')).toEqual({ enabled: true, stock: 5 })
    // the dimension's own pick does not constrain its siblings
    expect(optionState(skus, ['c1', 's1'], 0, 'c2').enabled).toBe(true)
  })
  it('toggles a pick off when tapped again', () => {
    expect(toggle(['c1', null], 0, 'c1')).toEqual([null, null])
    expect(toggle(['c1', null], 1, 's1')).toEqual(['c1', 's1'])
  })
  it('swaps the gallery to the picked first-dimension image', () => {
    expect(galleryImageFor(dims, ['c1', null])).toBe('black.jpg')
    expect(galleryImageFor(dims, ['c2', null])).toBeUndefined()
  })
})

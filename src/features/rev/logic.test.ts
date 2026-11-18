import { canEditReview, emptyReview, isDirty, maskName, pruneTags, tagsFor } from './logic'

test('tags follow the stars and prune across the 3/4 boundary', () => {
  expect(tagsFor(0)).toEqual([])
  expect(tagsFor(5)).toContain('Đáng tiền')
  expect(tagsFor(2)).toContain('Shop phản hồi chậm')
  expect(pruneTags(['Đáng tiền', 'Đúng mô tả'], 4)).toEqual(['Đáng tiền', 'Đúng mô tả'])
  expect(pruneTags(['Đáng tiền', 'Giao hàng chậm'], 3)).toEqual(['Giao hàng chậm'])
})

test('masked name keeps first and last letter', () => {
  expect(maskName('Lê Thu Hà')).toBe('L***à')
  expect(maskName('Lê Thu Hà')).toBe('L***à')
  expect(maskName('A')).toBe('A***')
})

test('one edit until the shop replies', () => {
  expect(canEditReview({})).toBe(true)
  expect(canEditReview({ editedAt: 1 })).toBe(false)
  expect(canEditReview({ shopReply: { text: 'Cảm ơn', at: 1 } })).toBe(false)
})

test('dirty draft', () => {
  expect(isDirty(emptyReview())).toBe(false)
  expect(isDirty({ ...emptyReview(), text: ' a ' })).toBe(true)
})

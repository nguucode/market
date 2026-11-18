import { compactCount, compactVnd, discountPct, signedVnd, vnd } from './money'

test('vnd uses dot thousands and no space', () => {
  expect(vnd(330448)).toBe('330.448₫')
  expect(vnd(0)).toBe('0₫')
  expect(vnd(112_499_000)).toBe('112.499.000₫')
  expect(vnd(-30000)).toBe('−30.000₫')
  expect(signedVnd(22000)).toBe('+22.000₫')
})

test('compact forms round down', () => {
  expect(compactVnd(200_000)).toBe('200K')
  expect(compactVnd(1_290_000)).toBe('1,2Tr')
  expect(compactVnd(2_000_000)).toBe('2Tr')
  expect(compactCount(1_290)).toBe('1,2k')
  expect(compactCount(980)).toBe('980')
  expect(compactCount(1_250_000)).toBe('1,2tr')
})

test('discount percent floors and ignores missing promo price', () => {
  expect(discountPct(330448, 541791)).toBe(39)
  expect(discountPct(100, undefined)).toBe(0)
  expect(discountPct(100, 90)).toBe(0)
})

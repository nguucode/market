import { etaText, quoteShipping, startOfDay } from './shipping'

const NOW = Date.UTC(2026, 10, 18, 5) // 12:00 in Vietnam

test('express only within one province; §4.3 fees: 22.000₫ same city, 35.000₫ across regions', () => {
  const same = quoteShipping(48, 48, 800, NOW)
  expect(same.map((q) => q.option)).toEqual(['express', 'fast', 'economy'])
  expect(same.find((q) => q.option === 'fast')?.fee).toBe(22_000)
  const far = quoteShipping(79, 48, 800, NOW)
  expect(far.map((q) => q.option)).toEqual(['fast', 'economy'])
  expect(far[0].fee).toBe(35_000)
})

test('heavy parcels add 5.000₫ per kg over 2kg', () => {
  expect(quoteShipping(1, 1, 4100, NOW).find((q) => q.option === 'fast')?.fee).toBe(22_000 + 15_000)
})

test('eta text', () => {
  const [a, b] = quoteShipping(79, 48, 500, NOW)[0].eta
  expect(etaText([a, b], NOW)).toBe('Nhận hàng 21/11\u00a0\u2060–\u2060\u00a023/11')
  expect(etaText([startOfDay(NOW), startOfDay(NOW)], NOW)).toBe('Nhận hàng hôm nay')
})

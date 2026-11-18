import { dm, dmy, hm, vnStartOfDay } from './time'

test('formats in Vietnam time whatever the runtime timezone', () => {
  const t = Date.UTC(2026, 10, 17, 23, 5) // 06:05 on 18/11 in Vietnam
  expect(dmy(t)).toBe('18/11/2026')
  expect(dm(t)).toBe('18/11')
  expect(hm(t)).toBe('06:05')
  expect(dmy(vnStartOfDay(t))).toBe('18/11/2026')
  expect(hm(vnStartOfDay(t))).toBe('00:00')
})

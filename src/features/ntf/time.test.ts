import { describe, expect, test } from 'vitest'
import { fmtDate, fmtTime, relativeTime } from './time'

/** A wall-clock time in Vietnam (UTC+7), so tests pass in any runner timezone. */
const vnt = (y: number, mo: number, d: number, h = 0, mi = 0) => Date.UTC(y, mo, d, h, mi) - 7 * 3_600_000

const now = vnt(2026, 10, 18, 14, 5)
describe('relativeTime', () => {
  test('under a minute (and future skew) reads Vừa xong', () => {
    expect(relativeTime(now - 59_000, now)).toBe('Vừa xong')
    expect(relativeTime(now + 5_000, now)).toBe('Vừa xong')
  })
  test('minutes and hours round down', () => {
    expect(relativeTime(now - 60_000, now)).toBe('1 phút trước')
    expect(relativeTime(now - 59 * 60_000, now)).toBe('59 phút trước')
    expect(relativeTime(now - 60 * 60_000, now)).toBe('1 giờ trước')
    expect(relativeTime(now - (24 * 60 - 1) * 60_000, now)).toBe('23 giờ trước')
  })
  test('24 hours or more shows the date', () => {
    expect(relativeTime(now - 24 * 3_600_000, now)).toBe('17/11/2026')
  })
})
test('fmtDate and fmtTime pad', () => {
  const t = vnt(2026, 0, 3, 9, 7)
  expect(fmtDate(t)).toBe('03/01/2026')
  expect(fmtTime(t)).toBe('09:07')
})

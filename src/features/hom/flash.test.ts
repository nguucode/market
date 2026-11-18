import { describe, expect, test } from 'vitest'
import type { FlashItem, FlashSlot } from '@/domain/types'
import { almostGone, flashSlotState, formatCountdown, orderFlashItems, resolveSelectedSlot, slotStatus, startLabel, visibleSlots } from './flash'

/** A wall-clock time in Vietnam (UTC+7), so tests pass in any runner timezone. */
const vnt = (y: number, mo: number, d: number, h = 0, mi = 0) => Date.UTC(y, mo, d, h, mi) - 7 * 3_600_000

const H = 3_600_000
const now = vnt(2026, 10, 18, 13, 0)
const at = (d: number, h: number) => vnt(2026, 10, 18 + d, h)
const slot = (id: string, a: number, b: number): FlashSlot => ({ id, startsAt: a, endsAt: b, items: [] })
const slots = [
  slot('tomorrow2', at(1, 3), at(1, 6)),
  slot('ended', at(0, 9), at(0, 12)),
  slot('active', at(0, 12), at(0, 18)),
  slot('later', at(0, 18), at(0, 22)),
  slot('tomorrow', at(1, 0), at(1, 3)),
  slot('dayafter', at(2, 0), at(2, 3)),
]

describe('visibleSlots', () => {
  test('drops ended and beyond tomorrow, sorted by start', () => {
    expect(visibleSlots(slots, now).map((s) => s.id)).toEqual(['active', 'later', 'tomorrow', 'tomorrow2'])
  })
})

describe('flashSlotState', () => {
  test('active and next with remaining times', () => {
    const s = flashSlotState(slots, now)
    expect(s.active?.id).toBe('active')
    expect(s.next?.id).toBe('later')
    expect(s.endsInMs).toBe(5 * H)
    expect(s.startsInMs).toBe(5 * H)
  })
  test('at the exact end the next slot takes over', () => {
    const s = flashSlotState(slots, at(0, 18))
    expect(s.active?.id).toBe('later')
  })
  test('no active slot: only next', () => {
    const s = flashSlotState(slots, at(0, 22) + 1)
    expect(s.active).toBeUndefined()
    expect(s.next?.id).toBe('tomorrow')
  })
  test('nothing today or tomorrow', () => {
    expect(flashSlotState([slots[5]], now)).toEqual({ active: undefined, next: undefined, endsInMs: undefined, startsInMs: undefined })
  })
})

describe('resolveSelectedSlot', () => {
  test('keeps a valid param, falls back to active then next', () => {
    expect(resolveSelectedSlot('tomorrow', slots, now)?.id).toBe('tomorrow')
    expect(resolveSelectedSlot('ended', slots, now)?.id).toBe('active')
    expect(resolveSelectedSlot('nope', slots, at(0, 22) + 1)?.id).toBe('tomorrow')
    expect(resolveSelectedSlot(null, [], now)).toBeUndefined()
  })
})

describe('formatCountdown', () => {
  test.each([
    [83 * 60_000, '1 giờ 23 phút'],
    [23 * 60_000 + 59_000, '23 phút'],
    [59_999, 'dưới 1 phút'],
    [2 * H, '2 giờ'],
    [24 * H - 60_000, '23 giờ 59 phút'],
  ])('%i ms → %s', (ms, s) => expect(formatCountdown(ms)).toBe(s))
})

test('startLabel and slotStatus know tomorrow', () => {
  expect(startLabel(at(0, 18), now)).toBe('Bắt đầu lúc 18:00')
  expect(startLabel(at(1, 0), now)).toBe('Bắt đầu lúc 00:00 ngày mai')
  expect(slotStatus(slots[2], now)).toBe('Đang diễn ra')
  expect(slotStatus(slots[3], now)).toBe('Sắp diễn ra')
  expect(slotStatus(slots[4], now)).toBe('Ngày mai')
})

test('sold out last, Sắp hết from 90%', () => {
  const it = (skuId: string, sold: number): FlashItem => ({ skuId, productId: skuId, salePrice: 1, quota: 100, sold, perBuyerLimit: 1 })
  expect(orderFlashItems([it('a', 100), it('b', 5), it('c', 100), it('d', 0)]).map((i) => i.skuId)).toEqual(['b', 'd', 'a', 'c'])
  expect(almostGone(it('x', 89))).toBe(false)
  expect(almostGone(it('x', 90))).toBe(true)
  expect(almostGone(it('x', 100))).toBe(false)
})

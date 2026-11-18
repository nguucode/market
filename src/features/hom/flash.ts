import { vnStartOfDay } from '@/domain/time'
// Flash-sale slot logic shared by the Home band (US-HOM-003) and the flash sale page (US-PRM-001). Pure.
import type { FlashItem, FlashSlot } from '@/domain/types'
import { fmtTime } from '@/features/ntf/time'

const startOfDay = vnStartOfDay // Vietnam calendar day, whatever the browser timezone
/** Start of the day after tomorrow: slots shown are today + tomorrow only. */
const horizon = (now: number) => startOfDay(now) + 2 * 86_400_000

/** Slots not yet ended that start before the end of tomorrow, by start time. */
export function visibleSlots(slots: FlashSlot[], now: number): FlashSlot[] {
  const end = horizon(now)
  return slots.filter((s) => s.endsAt > now && s.startsAt < end).sort((a, b) => a.startsAt - b.startsAt)
}

export type SlotState = { active?: FlashSlot; next?: FlashSlot; endsInMs?: number; startsInMs?: number }
export function flashSlotState(slots: FlashSlot[], now: number): SlotState {
  const vis = visibleSlots(slots, now)
  const active = vis.find((s) => s.startsAt <= now)
  const next = vis.find((s) => s.startsAt > now)
  return { active, next, endsInMs: active && active.endsAt - now, startsInMs: next && next.startsAt - now }
}

/** `?slot=` resolution: a visible slot by id, else the active one, else the next. */
export function resolveSelectedSlot(param: string | null, slots: FlashSlot[], now: number): FlashSlot | undefined {
  const vis = visibleSlots(slots, now)
  return vis.find((s) => s.id === param) ?? vis[0]
}

/** "1 giờ 23 phút" / "23 phút" / "dưới 1 phút". Minutes round down (the text updates once a minute). */
export function formatCountdown(ms: number): string {
  if (ms < 60_000) return 'dưới 1 phút'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (!h) return `${m} phút`
  return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

const isTomorrow = (t: number, now: number) => startOfDay(t) > startOfDay(now)
/** "Bắt đầu lúc 18:00" or "Bắt đầu lúc 00:00 ngày mai". */
export const startLabel = (startsAt: number, now: number) => `Bắt đầu lúc ${fmtTime(startsAt)}${isTomorrow(startsAt, now) ? ' ngày mai' : ''}`
/** Tab status line: "Đang diễn ra", "Sắp diễn ra", "Ngày mai". */
export function slotStatus(s: FlashSlot, now: number): string {
  if (s.startsAt <= now) return 'Đang diễn ra'
  return isTomorrow(s.startsAt, now) ? 'Ngày mai' : 'Sắp diễn ra'
}

export const soldOut = (i: FlashItem) => i.sold >= i.quota
/** "Sắp hết" at 90% sold or more, until sold out. */
export const almostGone = (i: FlashItem) => !soldOut(i) && i.sold / i.quota >= 0.9
/** Sold-out items last, otherwise seed order. */
export const orderFlashItems = (items: FlashItem[]) => [...items.filter((i) => !soldOut(i)), ...items.filter(soldOut)]

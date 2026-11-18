// Date and relative-time copy: rules.md#spec-conventions ("18/11/2026", "14:05", relative only under 24 h).
const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

import { dmy, hm } from '@/domain/time'
/** `18/11/2026` in Vietnam time. */
export const fmtDate = dmy
/** `14:05` in Vietnam time. */
export const fmtTime = hm

/** "Vừa xong", "{n} phút trước", "{n} giờ trước", else the date. */
export function relativeTime(ms: number, now: number): string {
  const diff = now - ms
  if (diff < MIN) return 'Vừa xong'
  if (diff < HOUR) return `${Math.floor(diff / MIN)} phút trước`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ trước`
  return fmtDate(ms)
}

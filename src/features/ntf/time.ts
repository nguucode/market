// Date and relative-time copy: rules.md#spec-conventions ("18/11/2026", "14:05", relative only under 24 h).
const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

const p2 = (n: number) => String(n).padStart(2, '0')
/** `18/11/2026` in local time. */
export const fmtDate = (ms: number) => { const d = new Date(ms); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}` }
/** `14:05` in local time. */
export const fmtTime = (ms: number) => { const d = new Date(ms); return `${p2(d.getHours())}:${p2(d.getMinutes())}` }

/** "Vừa xong", "{n} phút trước", "{n} giờ trước", else the date. */
export function relativeTime(ms: number, now: number): string {
  const diff = now - ms
  if (diff < MIN) return 'Vừa xong'
  if (diff < HOUR) return `${Math.floor(diff / MIN)} phút trước`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ trước`
  return fmtDate(ms)
}

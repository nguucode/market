// Dates in Vietnam time (UTC+7) regardless of the browser's timezone: rules.md#spec-conventions.
const OFF = 7 * 3_600_000
const p2 = (n: number) => String(n).padStart(2, '0')
const vn = (ms: number) => new Date(ms + OFF)
/** `18/11/2026` */
export const dmy = (ms: number) => { const d = vn(ms); return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}` }
/** `18/11` */
export const dm = (ms: number) => { const d = vn(ms); return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}` }
/** `14:05` */
export const hm = (ms: number) => { const d = vn(ms); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}` }
/** Midnight in Vietnam time for a timestamp. */
export const vnStartOfDay = (ms: number) => Math.floor((ms + OFF) / 86_400_000) * 86_400_000 - OFF

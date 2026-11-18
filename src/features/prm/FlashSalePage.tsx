// US-PRM-001: flash sale page with slot tabs (today + tomorrow), sold bars, per-buyer limits. Calm: no seconds, no red.
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useNow, useWorld } from '@/app/store'
import { ButtonLink, cx, EmptyState, GridSkeleton, PageTitle, Skeleton, useLoaded } from '@/components/ui'
import { fmtTime } from '@/features/ntf/time'
import { formatCountdown, resolveSelectedSlot, slotStatus, startLabel, visibleSlots } from '@/features/hom/flash'
import { FlashCard, flashEntries } from '@/features/hom/FlashCard'

export default function FlashSalePage() {
  const w = useWorld()
  const t = useNow()
  const ready = useLoaded()
  const [sp, setSp] = useSearchParams()
  const slots = visibleSlots(w.flashSlots, t)
  const param = sp.get('slot')
  const selected = resolveSelectedSlot(param, w.flashSlots, t)

  // Unknown, ended or missing ?slot= → replace with the active (or next) slot; also runs when a slot ends on the minute tick.
  useEffect(() => {
    if (selected && selected.id !== param) setSp((p) => { p.set('slot', selected.id); return p }, { replace: true })
  }, [selected?.id, param]) // eslint-disable-line react-hooks/exhaustive-deps

  const title = <PageTitle className="mb-4 max-lg:sr-only lg:mb-6 lg:text-[36px]!">Flash sale</PageTitle>
  if (ready && !selected) return (
    <>{title}<EmptyState title="Chưa có Flash sale nào. Quay lại sau nhé." action={<ButtonLink to="/">Về Trang chủ</ButtonLink>} /></>
  )

  const active = !!selected && selected.startsAt <= t
  const entries = selected ? flashEntries(w, selected) : []
  return (
    <div className="pb-8">
      {title}
      <div className="sticky top-14 z-30 -mx-4 bg-jade-soft px-4 py-2 lg:static lg:mx-0 lg:rounded-[16px] lg:bg-jade-soft/60 lg:p-3">
        {ready && selected ? (
          <div role="tablist" aria-label="Khung giờ Flash sale" className="grid grid-cols-4 gap-1.5 lg:flex lg:gap-2">
            {slots.map((s) => {
              const on = s.id === selected.id
              return (
                <button key={s.id} type="button" role="tab" aria-selected={on} aria-controls="flash-grid"
                  onClick={() => setSp((p) => { p.set('slot', s.id); return p }, { replace: true })}
                  className={cx('flex min-h-14 flex-col items-center justify-center rounded-[12px] px-1 py-1.5 transition-colors lg:min-w-[160px] lg:rounded-full lg:px-6',
                    on ? 'bg-ink text-ground' : 'text-ink hover:bg-surface/70')}>
                  <span className="tabular text-[16px] leading-tight font-bold lg:text-[18px]">{fmtTime(s.startsAt)}</span>
                  <span className={cx('text-[11px] leading-tight lg:text-[12px]', on ? 'text-ground/85' : 'text-ink-2')}>{slotStatus(s, t)}</span>
                </button>
              )
            })}
          </div>
        ) : <div className="grid grid-cols-4 gap-1.5 lg:flex lg:gap-2" aria-hidden>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 rounded-[12px] lg:w-[160px] lg:rounded-full" />)}</div>}
      </div>
      {ready && selected ? (
        <>
          <p className="mt-4 mb-4 text-[14px] text-ink-2">
            {active ? `Kết thúc sau ${formatCountdown(selected.endsAt - t)}` : startLabel(selected.startsAt, t)}
          </p>
          <ul id="flash-grid" role="list" aria-label={`Sản phẩm khung ${fmtTime(selected.startsAt)}`} className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {entries.map((e) => <li key={e.item.skuId}><FlashCard entry={e} w={w} upcoming={!active} showLimit /></li>)}
          </ul>
        </>
      ) : <div className="mt-6"><GridSkeleton n={10} /></div>}
    </div>
  )
}

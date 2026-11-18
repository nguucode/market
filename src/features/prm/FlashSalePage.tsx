// US-PRM-001: flash sale page with slot tabs (today + tomorrow), sold bars, per-buyer limits. Calm: no seconds, no red.
import { Zap } from 'lucide-react'
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

  const title = <PageTitle className="mb-3 flex items-center gap-2 max-lg:sr-only"><Zap size={22} aria-hidden className="fill-accent text-accent" />Flash sale</PageTitle>
  if (ready && !selected) return (
    <>{title}<EmptyState className="panel max-w-none!" title="Chưa có Flash sale nào. Quay lại sau nhé." action={<ButtonLink to="/">Về Trang chủ</ButtonLink>} /></>
  )

  const active = !!selected && selected.startsAt <= t
  const entries = selected ? flashEntries(w, selected) : []
  return (
    <div className="space-y-2 pb-8 lg:space-y-3">
      {title}
      <div className="sticky top-14 z-30 -mx-3 bg-surface px-3 py-2 shadow-[0_1px_0_var(--color-line)] lg:static lg:mx-0 lg:rounded-[var(--radius-card)] lg:p-2 lg:shadow-none">
        {ready && selected ? (
          <div role="tablist" aria-label="Khung giờ Flash sale" className="grid grid-cols-4 gap-1.5 lg:flex lg:gap-2">
            {slots.map((s) => {
              const on = s.id === selected.id
              return (
                <button key={s.id} type="button" role="tab" aria-selected={on} aria-controls="flash-grid"
                  onClick={() => setSp((p) => { p.set('slot', s.id); return p }, { replace: true })}
                  className={cx('flex min-h-14 flex-col items-center justify-center rounded-[var(--radius-control)] px-1 py-1.5 transition-colors lg:min-w-[160px] lg:px-6',
                    on ? 'bg-accent-soft text-accent-ink ring-1 ring-inset ring-accent' : 'text-ink hover:bg-well')}>
                  <span className="tabular text-[16px] leading-tight font-bold lg:text-[18px]">{fmtTime(s.startsAt)}</span>
                  <span className={cx('text-[11px] leading-tight lg:text-[12px]', on ? 'font-semibold text-accent-ink' : 'text-muted')}>{slotStatus(s, t)}</span>
                </button>
              )
            })}
          </div>
        ) : <div className="grid grid-cols-4 gap-1.5 lg:flex lg:gap-2" aria-hidden>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 lg:w-[160px]" />)}</div>}
      </div>
      {ready && selected ? (
        <section aria-labelledby="flash-status" className="panel p-3 lg:p-5">
          <p id="flash-status" className="mb-3 text-[14px] font-semibold text-accent-ink lg:mb-4">
            {active ? `Kết thúc sau ${formatCountdown(selected.endsAt - t)}` : startLabel(selected.startsAt, t)}
          </p>
          <ul id="flash-grid" role="list" aria-label={`Sản phẩm khung ${fmtTime(selected.startsAt)}`} className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-4 xl:grid-cols-6">
            {entries.map((e) => <li key={e.item.skuId}><FlashCard entry={e} w={w} upcoming={!active} showLimit /></li>)}
          </ul>
        </section>
      ) : <GridSkeleton n={12} />}
    </div>
  )
}

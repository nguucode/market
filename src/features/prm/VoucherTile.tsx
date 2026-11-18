// Shared voucher tile, claim behaviour (US-PRM-002) and conditions sheet (US-PRM-003). Used by Home and the hub.
import { Truck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { getState, now, saveVoucher, useNow, useWorld } from '@/app/store'
import { voucherLabel } from '@/domain/pricing'
import type { Voucher } from '@/domain/types'
import { Button, ButtonLink, cx, Sheet, toast } from '@/components/ui'
import { applyTarget, claimFailText, describeVoucher, paymentLine, usesLeftLine, voucherCapLine, voucherExpiry, voucherOffer, voucherStubValue, voucherTileState, type TileState } from './vouchers'

function useClaim(v: Voucher) {
  const [pending, setPending] = useState(false)
  const [just, setJust] = useState(false)
  const [error, setError] = useState<string>()
  async function claim() {
    if (pending) return
    setPending(true); setError(undefined)
    const ok = await saveVoucher(v.id)
    setPending(false)
    if (ok) { toast('Đã lưu voucher'); setJust(true); setTimeout(() => setJust(false), 1200) }
    else setError(claimFailText(getState().world.vouchers.find((x) => x.id === v.id) ?? v, now()))
  }
  return { claim, pending, just, error }
}

function Action({ v, state, c, size = 'sm', full }: { v: Voucher; state: TileState; c: ReturnType<typeof useClaim>; size?: 'sm' | 'lg'; full?: boolean }) {
  const w = useWorld()
  const handle = v.shopId ? w.shops.find((s) => s.id === v.shopId)?.handle : undefined
  const name = voucherLabel(v)
  if (c.just) return <Button variant="secondary" size={size} full={full} disabled>Đã lưu</Button>
  if (state === 'saved') return <ButtonLink to={applyTarget(v, handle)} variant="secondary" size={size} full={full}>Dùng ngay</ButtonLink>
  if (state === 'claimable' && !c.error) return <Button variant="secondary" size={size} full={full} loading={c.pending} onClick={c.claim} aria-label={`Lưu ${name}`}>Lưu</Button>
  if (state === 'expired') return <Button variant="secondary" size={size} full={full} disabled>Đã hết hạn</Button>
  return <Button variant="secondary" size={size} full={full} disabled>Đã hết lượt</Button>
}

/** Ticket: tinted stub with the value in the accent, a perforated seam, white body with the conditions, one action. `bare` drops the action and the conditions link. */
export function VoucherTile({ voucher: v, className, bare }: { voucher: Voucher; className?: string; bare?: boolean }) {
  const w = useWorld()
  const t = useNow()
  const saved = w.savedVouchers.find((s) => s.voucherId === v.id)
  const state = voucherTileState(v, saved, t)
  const shop = v.shopId ? w.shops.find((s) => s.id === v.shopId) : undefined
  const pay = paymentLine(v)
  const usesLeft = usesLeftLine(v, saved)
  const stub = voucherStubValue(v)
  const dim = state === 'expired' || state === 'exhausted'
  const c = useClaim(v)
  const [cond, setCond] = useState(false)
  const notch = 'absolute left-[-6px] size-3 rounded-full bg-ground'
  return (
    <div className={cx('min-w-0', className)}>
      <article aria-label={voucherLabel(v)} className="flex h-full min-h-[112px] overflow-hidden rounded-[var(--radius-control)] bg-surface ring-1 ring-inset ring-line">
        <div aria-hidden className={cx('flex w-[88px] shrink-0 flex-col items-center justify-center gap-1 px-2 text-center lg:w-[96px]', dim ? 'bg-well text-muted' : 'bg-accent-soft text-accent')}>
          {stub ? <span className="tabular text-[22px] leading-none font-bold tracking-[-0.02em]">{stub}</span> : <Truck size={26} strokeWidth={1.7} />}
          <span className={cx('text-[11px] leading-tight font-semibold', dim ? 'text-muted' : 'text-accent-ink')}>{v.scope === 'shop' ? 'Shop' : v.scope === 'shipping' ? 'Vận chuyển' : 'Market'}</span>
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col border-l border-dashed border-line-strong p-3">
          <span aria-hidden className={cx(notch, '-top-1.5')} /><span aria-hidden className={cx(notch, '-bottom-1.5')} />
          {shop && <p className="truncate text-[12px] text-muted">Voucher của Shop · <span className="text-ink-2">{shop.name}</span></p>}
          {v.credit && <p className="text-[12px] text-muted">Hoàn tiền từ trả hàng</p>}
          <p className={cx('text-[15px] leading-snug font-bold', dim ? 'text-muted' : 'text-ink')}>{voucherOffer(v)}</p>
          <p className="text-[12px] leading-5 text-ink-2">{voucherCapLine(v)}</p>
          {pay && <p className="truncate text-[12px] leading-5 text-ink-2" title={pay}>{pay}</p>}
          <p className="text-[12px] leading-5 text-muted">{voucherExpiry(v, t)}{usesLeft && ` · ${usesLeft}`}</p>
          {!bare && (
            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
              <button type="button" onClick={() => setCond(true)} className="-ml-1 h-9 rounded-[var(--radius-control)] px-1 text-[12px] font-semibold text-ink-2 underline underline-offset-4 hover:text-accent-ink">Điều kiện</button>
              <Action v={v} state={state} c={c} />
            </div>
          )}
        </div>
      </article>
      {!bare && c.error && <p role="alert" className="mt-1.5 px-1 text-[12px] text-danger">{c.error}</p>}
      {!bare && <VoucherConditionsSheet voucher={v} open={cond} onOpenChange={setCond} />}
    </div>
  )
}

/** "Điều kiện sử dụng": every condition, plain language, same single action as the tile. */
export function VoucherConditionsSheet({ voucher: v, open, onOpenChange }: { voucher: Voucher; open: boolean; onOpenChange: (o: boolean) => void }) {
  const w = useWorld()
  const t = useNow()
  const saved = w.savedVouchers.find((s) => s.voucherId === v.id)
  const state = voucherTileState(v, saved, t)
  const shop = v.shopId ? w.shops.find((s) => s.id === v.shopId) : undefined
  const c = useClaim(v)
  const rows = describeVoucher(v, saved, shop, t)
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Điều kiện sử dụng"
      footer={<><Action v={v} state={state} c={c} size="lg" full />{c.error && <p role="alert" className="mt-2 text-center text-[13px] text-danger">{c.error}</p>}</>}>
      <VoucherTile voucher={v} bare />
      {(state === 'expired' || state === 'exhausted') && (
        <p className="mt-3 rounded-[var(--radius-control)] bg-well px-3 py-2 text-[14px] text-ink-2">{state === 'expired' ? 'Voucher đã hết hạn.' : 'Đã hết lượt'}</p>
      )}
      <dl className="mt-2">
        {rows.map((r) => (
          <div key={r.label} className="border-b border-line py-4 last:border-0 lg:grid lg:grid-cols-[150px_1fr] lg:gap-3">
            <dt className="text-[13px] text-muted lg:text-[14px]">{r.label}</dt>
            <dd className="mt-0.5 text-[15px] text-ink lg:mt-0">
              {r.href ? <Link to={r.href} className="text-accent-ink underline underline-offset-4">{r.value}</Link> : r.value}
              {r.note && <span className="block text-[14px] text-ink-2">{r.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Sheet>
  )
}

// US-ORD-001 Orders list by status (+ US-ORD-004/-005/-006 card actions, US-REV-002 card prompt).
import { Package } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { useNow, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, EmptyState, PageTitle, Skeleton, Tabs, useLoaded, vnd } from '@/components/ui'
import { RETURN_LABEL, STATUS_LABEL, type OrderTab } from '@/domain/orders'
import type { Order } from '@/domain/types'
import type { World } from '@/mock/seed'
import { ACTION_LABEL, COUNTED, ordersInTab, parseTab, primaryAction, TABS, tabCounts, whoCancelled } from './logic'
import { AccountAside, CancelRequestLine, LineRow, orderActions, PaymentCountdown, ShopName, useOrderActionRunner } from './parts'

const PAGE = 10

function OrderCard({ o, w, now }: { o: Order; w: World; now: number }) {
  const layout = useLayout()
  const ret = o.returnId ? w.returns.find((r) => r.id === o.returnId) : undefined
  const inReturns = o.status === 'return_requested' || o.status === 'returned'
  const label = inReturns && ret ? RETURN_LABEL[ret.status] : STATUS_LABEL[o.status]
  const primary = primaryAction(orderActions(w, o, now))
  const { run, busy, overlays } = useOrderActionRunner(o)
  const payment = o.status === 'awaiting_payment' ? w.payments.find((p) => p.id === o.paymentId) : undefined
  const outline = primary === 'detail' || primary === 'buy_again'
  return (
    <li className="relative border-b border-line py-4 last:border-0 lg:py-5">
      <div className="flex items-center justify-between gap-3">
        <ShopName w={w} shopId={o.shopId} />
        <span className={cx('shrink-0 text-[13px] font-semibold whitespace-nowrap', o.status === 'cancelled' ? 'text-muted' : o.status === 'awaiting_payment' ? 'text-jade-ink' : 'text-ink')}>{label}</span>
      </div>
      {o.status === 'to_ship' && o.cancelRequest?.status === 'pending' && <div className="mt-1"><CancelRequestLine>Đang chờ Shop phản hồi yêu cầu hủy</CancelRequestLine></div>}
      {o.status === 'cancelled' && <p className="mt-1 text-[13px] text-muted">{whoCancelled(o)}</p>}
      {payment && <PaymentCountdown payment={payment} className="mt-1" />}
      <Link to={`/orders/${o.id}`} className="mt-3 block text-ink no-underline after:absolute after:inset-0" aria-label={`Đơn hàng ${o.id}, ${label}`}>
        <LineRow line={o.lines[0]} w={w} link={false} />
      </Link>
      {o.lines.length > 1 && <p className="mt-2 pl-[76px] text-[13px] text-muted lg:pl-[84px]">+{o.lines.length - 1} sản phẩm</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[14px] whitespace-nowrap">Thành tiền: <strong className="tabular text-[16px] font-bold">{vnd(o.total)}</strong></p>
        <Button size={layout === 'app' ? 'sm' : 'md'} variant={outline ? 'secondary' : 'primary'} loading={busy === primary} className={cx('relative z-[1]', layout === 'app' && 'h-10')}
          onClick={() => run(primary)}>
          {primary === 'detail' ? 'Xem chi tiết' : ACTION_LABEL[primary]}
        </Button>
      </div>
      {overlays}
    </li>
  )
}

function CardSkeleton() {
  return (
    <li className="space-y-3 border-b border-line py-5" aria-hidden>
      <div className="flex justify-between"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-20" /></div>
      <div className="flex gap-3"><Skeleton className="size-16 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-1/3" /></div></div>
      <div className="flex justify-between"><Skeleton className="h-5 w-36" /><Skeleton className="h-10 w-28 rounded-full" /></div>
    </li>
  )
}

export default function OrdersPage() {
  const layout = useLayout()
  const w = useWorld()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const tab = parseTab(params.get('status'))
  const counts = tabCounts(w.orders)
  const list = ordersInTab(w.orders, tab)
  const [shown, setShown] = useState(PAGE)
  const ready = useLoaded([tab])
  useEffect(() => setShown(PAGE), [tab])
  const more = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = more.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((es) => es[0].isIntersecting && setShown((n) => n + PAGE), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ready, shown, list.length])
  const chipRow = useRef<HTMLDivElement>(null)
  useEffect(() => { chipRow.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [tab])

  const select = (t: OrderTab) => setParams(t === 'all' ? {} : { status: t }, { replace: true })
  const label = (t: (typeof TABS)[number]) => (COUNTED.includes(t.id) && counts[t.id] ? `${t.label} (${counts[t.id]})` : t.label)

  const body = !ready ? (
    <ul aria-busy="true" aria-label="Đang tải đơn hàng"><CardSkeleton /><CardSkeleton /><CardSkeleton /></ul>
  ) : list.length === 0 ? (
    <EmptyState icon={<Package size={24} />} title="Chưa có đơn hàng" action={<ButtonLink to="/">Tiếp tục mua sắm</ButtonLink>} />
  ) : (
    <>
      <ul className={cx(layout === 'app' && '-mx-4 bg-surface px-4')}>{list.slice(0, shown).map((o) => <OrderCard key={o.id} o={o} w={w} now={now} />)}</ul>
      {shown < list.length && <div className="py-4 text-center"><Button ref={more} variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Xem thêm đơn hàng</Button></div>}
    </>
  )

  if (layout === 'app')
    return (
      <div className="pb-8">
        <PageTitle className="sr-only">Đơn mua</PageTitle>
        <div ref={chipRow} role="tablist" aria-label="Trạng thái đơn hàng" className="no-scrollbar sticky top-14 z-30 -mx-4 -mt-4 flex gap-2 overflow-x-auto border-b border-line bg-ground px-4 py-2.5">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => select(t.id)}
              className={cx('flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap', tab === t.id ? 'bg-cta text-ground' : 'bg-surface text-ink ring-1 ring-line ring-inset')}>
              {label(t)}
            </button>
          ))}
        </div>
        <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.label}>{body}</div>
      </div>
    )
  return (
    <div className="mx-auto flex max-w-[1200px] gap-10 pb-10">
      <AccountAside />
      <div className="min-w-0 max-w-[960px] flex-1">
        <PageTitle>Đơn mua</PageTitle>
        <Tabs className="mt-4" label="Trạng thái đơn hàng" value={tab} onChange={select} items={TABS.map((t) => ({ id: t.id, label: label(t) }))} />
        <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.label} className="mt-2">{body}</div>
      </div>
    </div>
  )
}

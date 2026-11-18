// US-ORD-001 Orders list by status (+ US-ORD-004/-005/-006 card actions, US-REV-002 card prompt).
import { Package, Store } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { useNow, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, EmptyState, PageTitle, Skeleton, Tabs, useLoaded, vnd } from '@/components/ui'
import { RETURN_LABEL, STATUS_LABEL, type OrderTab } from '@/domain/orders'
import type { Order, OrderStatus } from '@/domain/types'
import type { World } from '@/mock/seed'
import { ACTION_LABEL, COUNTED, ordersInTab, parseTab, primaryAction, TABS, tabCounts, whoCancelled } from './logic'
import { AccountAside, CancelRequestLine, LineRow, orderActions, PaymentCountdown, ShopName, useOrderActionRunner } from './parts'

const PAGE = 10
/** Status text colour carries meaning: accent when the buyer must act, ok when done, muted when dead. */
const STATUS_TONE: Partial<Record<OrderStatus, string>> = { awaiting_payment: 'text-accent-ink', delivered: 'text-accent-ink', completed: 'text-ok', cancelled: 'text-muted' }

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
    <li className="panel relative p-3 lg:px-5 lg:py-4">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <span className="flex min-w-0 items-center gap-1.5"><Store size={16} aria-hidden className="shrink-0 text-ink-2" /><ShopName w={w} shopId={o.shopId} /></span>
        <span className={cx('shrink-0 text-[14px] font-semibold whitespace-nowrap', inReturns ? 'text-accent-ink' : STATUS_TONE[o.status] ?? 'text-ink')}>{label}</span>
      </div>
      {o.status === 'to_ship' && o.cancelRequest?.status === 'pending' && <div className="mt-2"><CancelRequestLine>Đang chờ Shop phản hồi yêu cầu hủy</CancelRequestLine></div>}
      {o.status === 'cancelled' && <p className="mt-2 text-[13px] text-muted">{whoCancelled(o)}</p>}
      {payment && <PaymentCountdown payment={payment} className="mt-2" />}
      <Link to={`/orders/${o.id}`} className="mt-3 block text-ink no-underline after:absolute after:inset-0" >
        <span className="sr-only">Đơn hàng {o.id}, {label}: </span>
        <LineRow line={o.lines[0]} w={w} link={false} />
      </Link>
      {o.lines.length > 1 && <p className="mt-2 pl-[92px] text-[13px] text-muted">+{o.lines.length - 1} sản phẩm</p>}
      <p className="mt-3 text-right text-[14px] whitespace-nowrap text-ink-2">Thành tiền: <strong className="tabular text-[18px] font-bold text-accent">{vnd(o.total)}</strong></p>
      <div className="mt-3 flex justify-end">
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
    <li className="panel space-y-3 p-3 lg:px-5 lg:py-4" aria-hidden>
      <div className="flex justify-between"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-20" /></div>
      <div className="flex gap-3"><Skeleton className="size-20 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-1/3" /></div></div>
      <div className="flex justify-end"><Skeleton className="h-5 w-36" /></div>
      <div className="flex justify-end"><Skeleton className="h-10 w-28" /></div>
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
  // Count as a tint badge; screen readers still hear "Chờ thanh toán (2)".
  const label = (t: (typeof TABS)[number]) => (COUNTED.includes(t.id) && counts[t.id] ? (
    <>{t.label}<span className="sr-only"> (</span><span className="tabular rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-accent-ink">{counts[t.id]}</span><span className="sr-only">)</span></>
  ) : t.label)

  const body = !ready ? (
    <ul aria-busy="true" aria-label="Đang tải đơn hàng" className="space-y-2 lg:space-y-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></ul>
  ) : list.length === 0 ? (
    <div className="panel"><EmptyState icon={<Package size={24} />} title="Chưa có đơn hàng" action={<ButtonLink to="/">Tiếp tục mua sắm</ButtonLink>} /></div>
  ) : (
    <>
      <ul className="space-y-2 lg:space-y-3">{list.slice(0, shown).map((o) => <OrderCard key={o.id} o={o} w={w} now={now} />)}</ul>
      {shown < list.length && <div className="py-4 text-center"><Button ref={more} variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Xem thêm đơn hàng</Button></div>}
    </>
  )

  if (layout === 'app')
    return (
      <div className="pb-8">
        <PageTitle className="sr-only">Đơn mua</PageTitle>
        <div ref={chipRow} className="sticky top-14 z-30 -mx-4 -mt-4 mb-2 bg-surface px-1">
          <Tabs label="Trạng thái đơn hàng" value={tab} onChange={select} items={TABS.map((t) => ({ id: t.id, label: label(t) }))} />
        </div>
        <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.label}>{body}</div>
      </div>
    )
  return (
    <div className="mx-auto flex max-w-[1200px] gap-6 pb-10">
      <AccountAside />
      <div className="min-w-0 max-w-[960px] flex-1">
        <div className="panel px-5 pt-4">
          <PageTitle>Đơn mua</PageTitle>
          <Tabs className="mt-2 -mx-2 border-b-0" label="Trạng thái đơn hàng" value={tab} onChange={select} items={TABS.map((t) => ({ id: t.id, label: label(t) }))} />
        </div>
        <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.label} className="mt-3">{body}</div>
      </div>
    </div>
  )
}

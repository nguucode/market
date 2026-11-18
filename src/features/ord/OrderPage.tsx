// US-ORD-002 Order detail (+ ORD-003 cancel, -004 confirm received, -005 pay, -006 buy again, -007 invoice link, US-REV-002 review banner, US-RET-001 entry).
import { ArrowLeft, ChevronRight, CircleX, CreditCard, FileText, MapPin, MoreHorizontal, Package, PackageCheck, RotateCcw, Store, Truck, Wallet, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { useNow, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, PageTitle, Sheet, Skeleton, useLoaded, vnd } from '@/components/ui'
import { PAYMENT_LABEL, RETURN_LABEL, STATUS_LABEL, type OrderAction } from '@/domain/orders'
import type { Order, OrderStatus, TrackingEvent } from '@/domain/types'
import NotFound from '@/features/demo/NotFound'
import { expireReturnDeadlines } from '@/features/ret/expire'
import type { World } from '@/mock/seed'
import {
  ACTION_LABEL, cancelRequestBanner, canRequestReturn, carrierLine, dmy, dmyhm, invoiceAvailable, orderEvents, primaryAction, refundInfo, reviewBannerText, reviewPrompt, statusSentence,
} from './logic'
import { CancelRequestLine, CopyButton, LineRow, orderActions, PaymentBreakdown, PaymentCountdown, ShopName, useOrderActionRunner } from './parts'

export default function OrderPage() {
  const { id } = useParams()
  const w = useWorld()
  const ready = useLoaded([id])
  const o = w.orders.find((x) => x.id === id)
  if (!o) return <NotFound what="đơn hàng" />
  if (!ready) return <DetailSkeleton />
  return <OrderDetail o={o} w={w} />
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] space-y-4 pb-10 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:space-y-0" aria-busy="true" aria-label="Đang tải đơn hàng">
      <div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-28 w-full" /><Skeleton className="h-48 w-full" /></div>
      <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>
    </div>
  )
}

const block = 'panel p-4 lg:p-5'
const h2 = 'font-display text-[16px] leading-tight'
const STATUS_ICON: Record<OrderStatus, LucideIcon> = {
  awaiting_payment: Wallet, to_confirm: Package, to_ship: Package, shipping: Truck, delivered: PackageCheck, completed: PackageCheck, cancelled: CircleX, return_requested: RotateCcw, returned: RotateCcw,
}

function Timeline({ events, limit }: { events: TrackingEvent[]; limit?: number }) {
  const list = limit ? events.slice(0, limit) : events
  return (
    <ol className="relative">
      {list.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
          <span aria-hidden className="relative flex w-2.5 shrink-0 justify-center">
            <span className={cx('rounded-full', i === 0 ? 'mt-[5px] size-2.5 bg-accent ring-4 ring-accent-soft' : 'mt-[7px] size-2 bg-line-strong')} />
            {i < list.length - 1 && <span className="absolute top-[17px] -bottom-[3px] w-px bg-line" />}
          </span>
          <div className={cx('min-w-0 text-[13px]', i === 0 ? 'text-ink' : 'text-muted')}>
            <p className={cx(i === 0 && 'font-semibold')}>{e.text}</p>
            <p className="tabular text-[12px]">{dmyhm(e.at)}{e.location && ` · ${e.location}`}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function OrderDetail({ o, w }: { o: Order; w: World }) {
  const layout = useLayout()
  const now = useNow()
  useEffect(() => { expireReturnDeadlines() }, [now])
  const { run, busy, overlays } = useOrderActionRunner(o)
  const actions = orderActions(w, o, now)
  const cardPick = primaryAction(actions)
  const primary: OrderAction | undefined = cardPick !== 'detail' ? cardPick : actions[0]
  const rest = actions.filter((a) => a !== primary)
  const events = orderEvents(w.tracking, o.id)
  const [allEvents, setAllEvents] = useState(false)
  const [eventSheet, setEventSheet] = useState(false)
  const [moreSheet, setMoreSheet] = useState(false)
  const ret = o.returnId ? w.returns.find((r) => r.id === o.returnId) : undefined
  const payment = w.payments.find((p) => p.id === o.paymentId)
  const prompt = reviewPrompt(o, now)
  const returnEntry = canRequestReturn(o, now)
  const banner = cancelRequestBanner(o)
  const refund = o.status === 'cancelled' ? refundInfo(o) : undefined
  const reviewOf = (reviewId?: string) => (reviewId ? w.reviews.find((r) => r.id === reviewId) : undefined)

  const StatusIcon = STATUS_ICON[o.status]
  const status = (
    <section aria-labelledby="order-status" className={cx(block, 'flex gap-3.5 lg:gap-4')}>
      <span aria-hidden className={cx('flex size-11 shrink-0 items-center justify-center rounded-full', o.status === 'cancelled' ? 'bg-well text-muted' : 'bg-accent-soft text-accent')}><StatusIcon size={22} /></span>
      <div className="min-w-0 flex-1">
      <h2 id="order-status" className="font-display text-[20px] leading-tight lg:text-[22px]">{o.status === 'return_requested' && ret ? RETURN_LABEL[ret.status] : STATUS_LABEL[o.status]}</h2>
      <p className="mt-1.5 text-[14px] text-ink-2">{statusSentence(o, ret)}</p>
      {o.status === 'awaiting_payment' && payment && (
        <div className="mt-2 space-y-1">
          <PaymentCountdown payment={payment} />
          {payment.orderIds.length > 1 && <p className="text-[13px] text-ink-2">Thanh toán chung cho {payment.orderIds.length} đơn hàng · <span className="whitespace-nowrap">Tổng {vnd(payment.amount)}</span></p>}
        </div>
      )}
      {banner && <div className="mt-2"><CancelRequestLine>{banner}</CancelRequestLine></div>}
      {refund && <p className={cx('mt-2 text-[13px]', refund.kind === 'refunded' ? 'font-semibold text-ink' : 'text-ink-2')}>{refund.text}</p>}
      </div>
    </section>
  )

  const reviewBanner = prompt.kind === 'none' ? null : prompt.kind === 'expired' ? (
    <p className="px-1 text-[13px] text-muted">{reviewBannerText(prompt)}</p>
  ) : prompt.kind === 'done' ? (
    <div className={cx(block, 'flex items-center justify-between gap-3 py-3 lg:py-3')}>
      <p className="text-[14px]">Bạn đã đánh giá tất cả sản phẩm.</p>
      <ButtonLink to={`/orders/${o.id}/review`} variant="secondary" size="sm">Xem đánh giá</ButtonLink>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[var(--radius-card)] bg-accent-soft px-4 py-3">
      <p className={cx('text-[14px] font-medium', prompt.daysLeft <= 2 ? 'text-accent-ink' : 'text-ink')}>{reviewBannerText(prompt)}</p>
      <ButtonLink to={`/orders/${o.id}/review`} variant="secondary" size="sm">{prompt.kind === 'partial' ? 'Đánh giá tiếp' : 'Đánh giá'}</ButtonLink>
    </div>
  )

  const tracking = (
    <section aria-labelledby="order-tracking" className={block}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2 id="order-tracking" className={cx(h2, 'whitespace-nowrap')}>Theo dõi đơn hàng</h2>
        <span className="text-[13px] text-muted">{carrierLine(o)}</span>
      </div>
      {events.length === 0 ? <p className="text-[13px] text-muted">Chưa có cập nhật vận chuyển.</p>
        : layout === 'app' ? (
          <button type="button" onClick={() => setEventSheet(true)} className="flex w-full items-center gap-3 text-left">
            <div className="min-w-0 flex-1"><Timeline events={events} limit={1} /><span className="sr-only">Xem toàn bộ hành trình đơn hàng</span></div>
            {events.length > 1 && <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />}
          </button>
        ) : (
          <>
            <Timeline events={events} limit={allEvents ? undefined : 3} />
            {events.length > 3 && <Button variant="link" className="mt-3" aria-expanded={allEvents} onClick={() => setAllEvents((v) => !v)}>{allEvents ? 'Thu gọn' : 'Xem thêm'}</Button>}
          </>
        )}
      <p className="mt-3 text-[12px] text-muted">Mã vận đơn <span className="tabular">{o.trackingCode}</span></p>
    </section>
  )

  const lines = (
    <section aria-label="Sản phẩm" className={block}>
      <div className="flex items-center gap-1.5 border-b border-line pb-3"><Store size={16} aria-hidden className="shrink-0 text-ink-2" /><ShopName w={w} shopId={o.shopId} className="whitespace-normal [&>span]:line-clamp-2 [&>span]:whitespace-normal" /></div>
      <ul className="mt-3 divide-y divide-line">
        {o.lines.map((l) => <li key={l.id} className="py-3 first:pt-0 last:pb-0"><LineRow line={l} w={w} review={reviewOf(l.reviewId)} /></li>)}
      </ul>
    </section>
  )

  const address = (
    <section aria-labelledby="order-address" className={block}>
      <h2 id="order-address" className={cx(h2, 'mb-2 flex items-center gap-2')}><MapPin size={17} aria-hidden className="text-accent" />Địa chỉ nhận hàng</h2>
      <p className="text-[14px] font-medium">{o.address.name} <span className="font-normal text-muted">· {o.address.phone}</span></p>
      <p className="mt-0.5 text-[13px] text-ink-2">{[o.address.detail, o.address.wardName, o.address.provinceName].filter(Boolean).join(', ')}</p>
    </section>
  )

  const money = (
    <section aria-labelledby="order-money" className={block}>
      <h2 id="order-money" className={cx(h2, 'mb-3')}>Chi tiết thanh toán</h2>
      <PaymentBreakdown order={o} />
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <CreditCard size={16} aria-hidden className="shrink-0 text-ink-2" />
        <h2 className="text-[13px] font-medium whitespace-nowrap text-muted">Phương thức thanh toán</h2>
        <p className="ml-auto min-w-0 text-right text-[14px]">{PAYMENT_LABEL[o.paymentMethod]}</p>
      </div>
    </section>
  )

  const row = (label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-1.5"><dt className="text-muted">{label}</dt><dd className="min-w-0 text-right">{value}</dd></div>
  )
  const details = (
    <section aria-labelledby="order-details" className={block}>
      <h2 id="order-details" className={cx(h2, 'mb-2')}>Thông tin đơn hàng</h2>
      <dl className="text-[13px]">
        <div className="flex items-center justify-between gap-4"><dt className="text-muted">Mã đơn hàng</dt><dd className="flex items-center gap-2"><span className="tabular font-medium">{o.id}</span><CopyButton text={o.id} /></dd></div>
        {row('Thời gian đặt hàng', <span className="tabular">{dmyhm(o.createdAt)}</span>)}
        {o.at.paid && row('Thời gian thanh toán', <span className="tabular">{dmyhm(o.at.paid)}</span>)}
        {o.at.delivered && row('Thời gian giao hàng', <span className="tabular">{dmyhm(o.at.delivered)}</span>)}
        {o.at.completed && row('Thời gian hoàn thành', <span className="tabular">{dmyhm(o.at.completed)}</span>)}
        {o.at.cancelled && row('Thời gian hủy', <span className="tabular">{dmyhm(o.at.cancelled)}</span>)}
        {o.messageToShop && row('Lời nhắn cho Shop', <span className="break-words">{o.messageToShop}</span>)}
        {returnEntry.ok && row('Hạn yêu cầu', <span className="tabular">{dmy(returnEntry.deadline!)}</span>)}
      </dl>
      {!returnEntry.ok && !o.returnId && returnEntry.deadline && (o.status === 'delivered' || o.status === 'completed') && (
        <p className="mt-2 text-[13px] text-muted">Đã hết hạn yêu cầu trả hàng/hoàn tiền ({dmy(returnEntry.deadline)}).</p>
      )}
      {o.returnId && !actions.includes('view_return') && <Link to={`/returns/${o.returnId}`} className="mt-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-accent-ink">Xem chi tiết trả hàng</Link>}
      {invoiceAvailable(o) && (
        <a href={`/orders/${o.id}/invoice`} target="_blank" rel="noopener" className="mt-2 flex min-h-11 items-center gap-2 border-t border-line pt-2 text-[14px] font-semibold text-ink no-underline hover:underline">
          <FileText size={16} aria-hidden />Tải hóa đơn
        </a>
      )}
    </section>
  )

  const btn = (a: OrderAction, variant: 'primary' | 'secondary', full = false) => (
    <Button key={a} variant={variant} full={full} loading={busy === a} onClick={() => run(a)}>{ACTION_LABEL[a]}</Button>
  )

  if (layout === 'app') {
    const left = rest[0]
    const extra = rest.slice(1)
    return (
      <div className={cx('space-y-2', primary ? 'pb-24' : 'pb-8')}>
        <PageTitle className="sr-only">Chi tiết đơn hàng</PageTitle>
        {status}
        {reviewBanner}
        {tracking}
        {address}
        {lines}
        {money}
        {details}
        {primary && (
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 bg-surface px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar)]">
            {extra.length > 0 && <Button variant="ghost" className="px-3" aria-label="Thêm thao tác" onClick={() => setMoreSheet(true)}><MoreHorizontal size={20} aria-hidden />Thêm</Button>}
            <span className="flex-1" />
            {left && btn(left, 'secondary')}
            {btn(primary, 'primary')}
          </div>
        )}
        <Sheet open={eventSheet} onOpenChange={setEventSheet} title="Theo dõi đơn hàng" description={carrierLine(o)}><Timeline events={events} /></Sheet>
        <Sheet open={moreSheet} onOpenChange={setMoreSheet} title="Thêm thao tác">
          <div className="space-y-2">{extra.map((a) => <Button key={a} variant="secondary" full onClick={() => { setMoreSheet(false); run(a) }}>{ACTION_LABEL[a]}</Button>)}</div>
        </Sheet>
        {overlays}
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-[1120px] pb-12">
      <Link to="/orders" className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-ink-2 no-underline hover:text-ink"><ArrowLeft size={16} aria-hidden />Đơn mua</Link>
      <PageTitle className="mb-4">Chi tiết đơn hàng</PageTitle>
      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-4">
        <div className="space-y-3">{status}{reviewBanner}{tracking}{lines}</div>
        <aside className="sticky top-[140px] space-y-3">
          {actions.length > 0 && <div className={cx(block, 'space-y-2')}>{primary && btn(primary, 'primary', true)}{rest.map((a) => btn(a, 'secondary', true))}</div>}
          {address}
          {money}
          {details}
        </aside>
      </div>
      {overlays}
    </div>
  )
}

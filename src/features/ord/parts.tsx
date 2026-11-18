// Pieces shared by the order list, detail, invoice and the RET/REV screens: lines, money, countdown, and the action overlays (US-ORD-003..006).
import { BadgeCheck, Clock } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { buyAgain, cancelOrder, confirmReceived, delay, paymentOpen, productById, requestCancel, syncTime, useNow, useWorld, withdrawCancel } from '@/app/store'
import { Button, Confirm, cx, Img, MoneyFold, Price, Sheet, Stars, toast, vnd } from '@/components/ui'
import { returnWindowEnds, type OrderAction } from '@/domain/orders'
import type { Order, OrderLine, Payment, Review } from '@/domain/types'
import type { World } from '@/mock/seed'
import { buyAgainToast, CANCEL_REASONS, cancelMode, dmy, hm, ordersSharingPayment, paymentRows, refundCopy, timeLeft, visibleActions } from './logic'

/* ── Context per order ─────────────────────────────────────────────── */

export const allDelisted = (w: World, o: Order) => o.lines.every((l) => productById(w, l.productId)?.status !== 'active')
export function orderActions(w: World, o: Order, now: number) {
  return visibleActions(o, now, paymentOpen(w, o.paymentId, now), allDelisted(w, o))
}

/* ── Lines ─────────────────────────────────────────────────────────── */

/** One purchased line from the snapshot. Delisted products keep name and image but are not links. */
export function LineRow({ line, w, link = true, review, className }: { line: OrderLine; w: World; link?: boolean; review?: Review; className?: string }) {
  const p = productById(w, line.productId)
  const live = p?.status === 'active'
  const name = <span className="line-clamp-2 text-[14px] leading-snug" title={line.name}>{line.name}</span>
  return (
    <div className={cx('flex gap-3', className)}>
      <Img src={line.image} alt="" className="size-20 shrink-0 rounded-[var(--radius-control)]" />
      <div className="min-w-0 flex-1">
        {link && live ? <Link to={`/p/${p!.slug}`} className="text-ink no-underline hover:underline">{name}</Link> : name}
        {line.variantText && <p className="mt-0.5 text-[12px] text-muted">Phân loại: {line.variantText}</p>}
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-[13px] text-muted tabular">x{line.qty}</span>
          <Price price={line.unitPrice} before={line.beforePromo} size="sm" />
        </div>
        {!live && <p className="mt-1 text-[12px] text-muted">Sản phẩm không còn bán</p>}
        {review && <p className="mt-1 flex items-center gap-2 text-[12px] text-ink-2"><Stars value={review.rating} size={12} />Đã đánh giá</p>}
      </div>
    </div>
  )
}

/* ── Money ─────────────────────────────────────────────────────────── */

/** "Chi tiết thanh toán": snapshot only, never recalculated (rules.md#checkout-disclosures). */
export function PaymentBreakdown({ order, label = 'Thành tiền' }: { order: Order; label?: string }) {
  const { rows, consistent } = paymentRows(order)
  if (!consistent && import.meta.env.DEV) console.error(`Order ${order.id}: snapshot does not add up`)
  return (
    <MoneyFold label={label} total={order.total} defaultOpen size="md" footnote="Giá đã bao gồm VAT"
      lines={rows.map((r) => ({ label: r.label, amount: r.amount, tone: r.minus ? 'minus' : undefined }))} />
  )
}

/* ── Payment countdown (US-ORD-005) ────────────────────────────────── */

export function PaymentCountdown({ payment, className }: { payment: Payment; className?: string }) {
  const now = useNow(1000)
  const t = timeLeft(payment.expiresAt, now)
  useEffect(() => { if (t.expired) syncTime() }, [t.expired])
  if (t.expired) return null
  return (
    <p className={cx('text-[13px] text-ink-2', className)}>
      Thanh toán trước {hm(payment.expiresAt)} · <span className="tabular font-semibold text-accent-ink">còn {t.mm}:{t.ss}</span>
      {t.soon && <span className="ml-1.5 font-semibold text-accent-ink">Sắp hết hạn</span>}
    </p>
  )
}

/* ── Action overlays ───────────────────────────────────────────────── */

const STALE = 'Trạng thái đơn hàng đã thay đổi.'

export function ConfirmReceivedDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (o: boolean) => void }) {
  const layout = useLayout()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (open && !busy && order.status !== 'delivered') { onOpenChange(false); toast(STALE) }
  }, [open, busy, order.status]) // eslint-disable-line react-hooks/exhaustive-deps
  const deadline = returnWindowEnds(order)
  const go = async () => {
    setBusy(true); setError('')
    try { await confirmReceived(order.id); onOpenChange(false); toast('Đơn hàng đã hoàn thành') } catch { setError('Không xác nhận được. Vui lòng thử lại.') }
    setBusy(false)
  }
  const primary = <Button loading={busy} onClick={go} full={layout === 'app'}>Đã nhận được hàng</Button>
  const later = <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)} full={layout === 'app'}>Để sau</Button>
  return (
    <Sheet open={open} onOpenChange={(v) => !busy && onOpenChange(v)} title="Xác nhận đã nhận được hàng?" dialog
      footer={layout === 'app' ? <div className="flex flex-col gap-2">{primary}{later}</div> : <div className="flex items-center justify-between gap-2">{later}{primary}</div>}>
      <p className="text-[14px] leading-relaxed text-ink-2">
        Hãy kiểm tra sản phẩm trước khi xác nhận. Bạn vẫn có thể yêu cầu trả hàng/hoàn tiền đến <strong className="font-semibold text-ink">{deadline ? dmy(deadline) : ''}</strong>.
      </p>
      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
    </Sheet>
  )
}

export function CancelSheet({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (o: boolean) => void }) {
  const w = useWorld()
  const [mode, setMode] = useState(() => cancelMode(order))
  const [reason, setReason] = useState('')
  const [other, setOther] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) { setMode(cancelMode(order)); setError('') }
    wasOpen.current = open
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const live = cancelMode(order)
  useEffect(() => {
    // A Demo control moved the order while the sheet was open.
    if (open && !busy && mode !== 'none' && live !== mode) { onOpenChange(false); toast(STALE) }
  }, [live]) // eslint-disable-line react-hooks/exhaustive-deps
  const group = ordersSharingPayment(order, w.orders)
  const paid = order.paymentStatus === 'paid'
  const text = reason === 'Lý do khác' ? other.trim() : reason
  const submit = async () => {
    setBusy(true); setError('')
    try {
      if (mode === 'immediate') { await cancelOrder(order.id, text); toast('Đã hủy đơn hàng') }
      else { await requestCancel(order.id, text); toast('Đã gửi yêu cầu hủy') }
      onOpenChange(false); setReason(''); setOther('')
    } catch { setError('Không hủy được đơn hàng. Vui lòng thử lại.') }
    setBusy(false)
  }
  if (mode === 'none' || mode === 'withdraw')
    return <Sheet open={open} onOpenChange={onOpenChange} title="Lý do hủy"><p className="text-[14px] text-ink-2">Đơn hàng không thể hủy ở trạng thái hiện tại.</p></Sheet>
  return (
    <Sheet open={open} onOpenChange={(v) => !busy && onOpenChange(v)} title="Lý do hủy"
      footer={
        <div className="space-y-3">
          <div className="space-y-1 rounded-[var(--radius-control)] bg-well px-3.5 py-3 text-[13px] leading-relaxed text-ink-2">
            <p>{refundCopy(order.paymentMethod, order.paymentStatus)}</p>
            {paid && <p className="whitespace-nowrap">Số tiền hoàn: <strong className="tabular font-semibold text-ink">{vnd(order.total)}</strong></p>}
            <p>Voucher đã dùng cho đơn hàng này sẽ không được hoàn lại.</p>
          </div>
          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
          <Button full size="lg" loading={busy} disabled={!text} onClick={submit}>{mode === 'immediate' ? 'Hủy đơn hàng' : 'Gửi yêu cầu'}</Button>
        </div>
      }>
      {mode === 'request' && <p className="mb-3 text-[13px] leading-relaxed text-ink-2">Đơn hàng đã được Shop chuẩn bị. Shop sẽ xem xét yêu cầu của bạn. Bạn chỉ có thể gửi yêu cầu hủy một lần cho đơn hàng này.</p>}
      {group.length > 1 && <p className="mb-3 text-[13px] font-medium text-ink">Các đơn hàng cùng lần thanh toán ({group.length} đơn) cũng sẽ bị hủy.</p>}
      <fieldset>
        <legend className="sr-only">Lý do hủy</legend>
        {CANCEL_REASONS.map((r) => (
          <label key={r} className="flex min-h-12 cursor-pointer items-start gap-3 border-b border-line py-3 last:border-0">
            <input type="radio" name="cancel-reason" checked={reason === r} disabled={busy} onChange={() => setReason(r)} className="mt-0.5 size-[18px] shrink-0 accent-[var(--color-accent)]" />
            <span className="text-[14px] leading-snug">{r}</span>
          </label>
        ))}
      </fieldset>
      {reason === 'Lý do khác' && (
        <div className="mt-2">
          <label htmlFor="cancel-other" className="mb-1.5 block text-[13px] font-medium text-ink-2">Nhập lý do</label>
          <textarea id="cancel-other" value={other} maxLength={200} rows={3} disabled={busy} onChange={(e) => setOther(e.target.value)}
            className="w-full resize-none rounded-[var(--radius-control)] bg-surface px-3.5 py-2.5 text-[14px] ring-1 ring-line-strong outline-none ring-inset focus:ring-2 focus:ring-accent" />
          <p className="text-right text-[12px] text-muted tabular">{other.length}/200</p>
        </div>
      )}
    </Sheet>
  )
}

/** Runs every order action from one place so a card and the detail behave the same. */
export function useOrderActionRunner(order: Order) {
  const nav = useNavigate()
  const w = useWorld()
  const [overlay, setOverlay] = useState<'cancel' | 'received' | 'withdraw' | null>(null)
  const [busy, setBusy] = useState<OrderAction | null>(null)
  const run = async (a: OrderAction | 'detail') => {
    switch (a) {
      case 'detail': return nav(`/orders/${order.id}`)
      case 'pay':
        if (!w.payments.some((p) => p.id === order.paymentId)) return toast('Không mở được trang thanh toán.', { tone: 'error' })
        return nav(`/checkout/pay/${order.paymentId}`)
      case 'cancel': case 'request_cancel': return setOverlay('cancel')
      case 'withdraw_cancel': return setOverlay('withdraw')
      case 'confirm_received': return setOverlay('received')
      case 'return': return nav(`/orders/${order.id}/return`)
      case 'review': return nav(`/orders/${order.id}/review`)
      case 'view_return': return order.returnId && nav(`/returns/${order.returnId}`)
      case 'invoice': return window.open(`/orders/${order.id}/invoice`, '_blank', 'noopener')
      case 'buy_again': {
        if (busy) return
        setBusy('buy_again')
        try {
          await delay()
          const r = buyAgain(order.id)
          toast(buyAgainToast(r.added, r.skipped), { tone: r.added ? 'ok' : 'error' })
          if (r.added) nav('/cart')
        } catch { toast('Không thêm được vào giỏ. Vui lòng thử lại.', { tone: 'error' }) }
        setBusy(null)
      }
    }
  }
  const overlays = (
    <>
      <CancelSheet order={order} open={overlay === 'cancel'} onOpenChange={(o) => setOverlay(o ? 'cancel' : null)} />
      {overlay === 'received' && <ConfirmReceivedDialog order={order} open onOpenChange={(o) => setOverlay(o ? 'received' : null)} />}
      <Confirm open={overlay === 'withdraw'} onOpenChange={(o) => setOverlay(o ? 'withdraw' : null)} title="Rút yêu cầu hủy?"
        body="Bạn chỉ gửi được yêu cầu hủy một lần. Sau khi rút, đơn hàng tiếp tục được giao và bạn không thể gửi lại yêu cầu hủy."
        confirmLabel="Rút yêu cầu" onConfirm={() => { withdrawCancel(order.id); setOverlay(null) }} />
    </>
  )
  return { run, busy, overlays }
}

/* ── Small bits ────────────────────────────────────────────────────── */

export function CopyButton({ text }: { text: string }) {
  return (
    <button type="button" className="min-h-11 px-1 text-[13px] font-semibold text-accent-ink hover:underline"
      onClick={() => navigator.clipboard?.writeText(text).then(() => toast('Đã sao chép'), () => toast('Không sao chép được', { tone: 'error' }))}>
      Sao chép
    </button>
  )
}

export function ShopName({ w, shopId, className, link = true }: { w: World; shopId: string; className?: string; link?: boolean }) {
  const s = w.shops.find((x) => x.id === shopId)
  if (!s) return null
  const inner = <><span className="min-w-0 truncate">{s.name}</span>{s.isOfficial && <BadgeCheck size={15} className="shrink-0 text-accent" aria-label="Shop chính hãng" />}</>
  return link
    ? <Link to={`/s/${s.handle}`} className={cx('relative z-[1] inline-flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-ink no-underline hover:underline', className)}>{inner}</Link>
    : <span className={cx('inline-flex min-w-0 items-center gap-1.5 text-[14px] font-semibold', className)}>{inner}</span>
}

export function CancelRequestLine({ children }: { children: ReactNode }) {
  return <p className="flex items-start gap-1.5 text-[13px] text-ink"><Clock size={14} className="mt-0.5 shrink-0" aria-hidden />{children}</p>
}

/** Web account area menu ("Đơn mua" active). */
export function AccountAside() {
  const items: [string, string][] = [['Tôi', '/me'], ['Đơn mua', '/orders'], ['Kho voucher', '/vouchers'], ['Địa chỉ', '/me/addresses'], ['Yêu thích', '/favorites'], ['Thông báo', '/notifications']]
  return (
    <nav aria-label="Tài khoản" className="panel sticky top-[140px] w-[200px] shrink-0 self-start p-2">
      <ul className="space-y-0.5">
        {items.map(([l, to]) => (
          <li key={to}><NavLink to={to} end className={({ isActive }) => cx('flex h-10 items-center rounded-[var(--radius-control)] px-3 text-[14px] no-underline', isActive ? 'bg-accent-soft font-semibold text-accent-ink' : 'text-ink-2 hover:bg-well hover:text-ink')}>{l}</NavLink></li>
        ))}
      </ul>
    </nav>
  )
}

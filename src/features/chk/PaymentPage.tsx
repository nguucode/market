// US-CHK-007: mock online payment (VietQR / wallet / card) with the 15-minute expiry from the Payment.
import { AlertCircle, Clock, Copy } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { expirePayment, pay, useNow, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, Field, inputClass, PageTitle, Skeleton, useLoaded, vnd } from '@/components/ui'
import { PAYMENT_LABEL } from '@/domain/orders'
import NotFound from '@/features/demo/NotFound'
import { formatCard, isTestCard, mmss, payRedirect, remainingSeconds, TEST_CARDS, transferContent, validExpiry } from './checkout'
import { getWallet } from './wallet'

const BANK = { name: 'Ngân hàng Sông Hàn', holder: 'CONG TY TNHH MARKET DEMO', number: '0400 2611 1826' }

export default function PaymentPage() {
  const { paymentId = '' } = useParams()
  const w = useWorld()
  const t = useNow(1000)
  const nav = useNavigate()
  const loaded = useLoaded([paymentId])
  const layout = useLayout()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const p = w.payments.find((x) => x.id === paymentId)
  const orders = p ? p.orderIds.map((id) => w.orders.find((o) => o.id === id)!).filter(Boolean) : []
  const left = p ? remainingSeconds(p.expiresAt, t) : 0
  const cancelled = orders.length > 0 && orders.every((o) => o.status === 'cancelled')
  const expired = !!p && (p.status === 'expired' || left === 0 || cancelled)

  // The store cancels the orders; the page only triggers it when the countdown runs out.
  useEffect(() => { if (p && left === 0 && p.status !== 'expired' && p.status !== 'paid') expirePayment(p.id) }, [p, left])

  if (!p) return <NotFound />
  const go = payRedirect(p)
  if (go) return <Navigate to={go} replace />

  const submit = async () => {
    setBusy(true); setFailed(false)
    try {
      const r = await pay(p.id)
      if (r === 'paid') nav(`/checkout/result/${p.id}`, { replace: true })
      else if (r === 'timeout') expirePayment(p.id)
      else setFailed(true)
    } catch { setFailed(true) } finally { setBusy(false) }
  }
  const web = layout === 'web'
  const shops = [...new Set(orders.map((o) => w.shops.find((s) => s.id === o.shopId)!.name))]

  if (expired) return (
    <div className="mx-auto max-w-[560px] py-6 text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-well text-ink-2" aria-hidden><Clock size={24} /></span>
      <PageTitle>Đã hết hạn thanh toán</PageTitle>
      <p className="mt-2 text-[14px] text-ink-2">{orders.length} đơn hàng đã được hệ thống hủy với lý do "Hết hạn thanh toán".</p>
      <div className={cx('mt-6 flex gap-3', web ? 'justify-center' : 'flex-col')}>
        <ButtonLink to="/orders?status=cancelled" size="lg">Xem đơn mua</ButtonLink>
        <ButtonLink to="/" variant="secondary" size="lg">Tiếp tục mua sắm</ButtonLink>
      </div>
    </div>
  )

  return (
    <div className={cx('mx-auto max-w-[560px] pb-10', !web && 'pb-[calc(96px+env(safe-area-inset-bottom))]')}>
      <PageTitle className={web ? 'mb-4' : 'sr-only'}>Thanh toán đơn hàng</PageTitle>
      {!loaded ? (
        <div aria-busy="true" aria-label="Đang tải" className="space-y-3"><Skeleton className="h-9 w-48" /><Skeleton className="h-4 w-64" /><Skeleton className="mx-auto mt-6 size-60" /></div>
      ) : (<>
        <section className="text-center">
          <p className="tabular text-[32px] leading-tight font-bold">{vnd(p.amount)}</p>
          <p className="mt-1 text-[14px] text-ink-2">{orders.length} đơn hàng · <span className="break-words">{shops.join(', ')}</span></p>
          <Countdown left={left} />
          <p className="mt-1 text-[13px] text-muted">{PAYMENT_LABEL[p.method]}{p.method === 'wallet' && ` · ${getWallet()}`}</p>
        </section>

        {failed && (
          <div role="alert" className="mt-5 flex items-start gap-2 rounded-[12px] bg-well p-4 text-[14px]">
            <AlertCircle size={18} aria-hidden className="mt-0.5 shrink-0" />
            <span><span className="font-semibold">Thanh toán không thành công</span><span className="block text-ink-2">Bạn có thể thử lại trước khi hết thời gian thanh toán.</span></span>
          </div>
        )}

        <div className="mt-6 rounded-[16px] bg-surface p-5">
          {p.method === 'vietqr' && <VietQr paymentId={p.id} amount={p.amount} busy={busy} onSubmit={submit} failed={failed} />}
          {p.method === 'wallet' && (
            <div className="space-y-4 text-center">
              <p className="text-[16px] font-semibold">Xác nhận thanh toán bằng {getWallet()}</p>
              <p className="tabular text-[22px] font-bold">{vnd(p.amount)}</p>
              <Button size="lg" full loading={busy} onClick={submit}>{busy ? 'Đang xử lý…' : failed ? 'Thử lại' : 'Xác nhận'}</Button>
            </div>
          )}
          {p.method === 'card' && <CardForm busy={busy} failed={failed} onSubmit={submit} />}
        </div>

        <div className="mt-5 text-center">
          <Button variant="ghost" onClick={() => nav('/orders?status=awaiting_payment')}>Thanh toán sau</Button>
        </div>
      </>)}
    </div>
  )
}

/** Visible mm:ss every second; screen readers hear each full minute only. */
function Countdown({ left }: { left: number }) {
  const mins = Math.ceil(left / 60)
  return (
    <>
      <p className={cx('tabular mt-3 text-[15px] text-ink-2', left < 60 && 'font-bold text-ink')} aria-hidden>Thanh toán trong {mmss(left)}</p>
      <p className="sr-only" aria-live="polite">Còn {mins} phút để thanh toán</p>
    </>
  )
}

function CopyRow({ label, value, copy = value }: { label: string; value: string; copy?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(false)
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(copy); setDone(true); setTimeout(() => setDone(false), 1500) }
    catch { const r = document.createRange(); if (ref.current) { r.selectNodeContents(ref.current); getSelection()?.removeAllRanges(); getSelection()?.addRange(r) } }
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0"><p className="text-[12px] text-muted">{label}</p><p className="tabular truncate text-[14px] font-semibold"><span ref={ref}>{value}</span></p></div>
      <Button size="sm" variant="ghost" onClick={onCopy} aria-label={`Sao chép ${label}`}><Copy size={14} aria-hidden />{done ? 'Đã chép' : 'Sao chép'}</Button>
    </div>
  )
}

function VietQr({ paymentId, amount, busy, failed, onSubmit }: { paymentId: string; amount: number; busy: boolean; failed: boolean; onSubmit: () => void }) {
  const [src, setSrc] = useState<string>()
  const content = transferContent(paymentId)
  useEffect(() => {
    // Fictional payload, generated locally; not a real VietQR/EMVCo string.
    QRCode.toDataURL(`MARKETDEMO|${BANK.number.replace(/\s/g, '')}|${amount}|${content}`, { margin: 1, width: 480, color: { dark: '#241f29', light: '#ffffff' } }).then(setSrc)
  }, [amount, content])
  return (
    <div>
      <div className="mx-auto size-60">{src ? <img src={src} alt={`Mã QR chuyển khoản ${vnd(amount)}`} className="size-full" /> : <Skeleton className="size-full" />}</div>
      <p className="mt-2 text-center text-[12px] text-muted">Mã QR mẫu, không dùng để chuyển tiền thật</p>
      <div className="mt-4 divide-y divide-line">
        <div className="py-2"><p className="text-[12px] text-muted">Ngân hàng</p><p className="text-[14px] font-semibold">{BANK.name}</p></div>
        <CopyRow label="Chủ tài khoản" value={BANK.holder} />
        <CopyRow label="Số tài khoản" value={BANK.number} copy={BANK.number.replace(/\s/g, '')} />
        <CopyRow label="Số tiền" value={vnd(amount)} copy={String(amount)} />
        <CopyRow label="Nội dung chuyển khoản" value={content} />
      </div>
      <Button size="lg" full className="mt-4" loading={busy} onClick={onSubmit}>{busy ? 'Đang xử lý…' : failed ? 'Thử lại' : 'Tôi đã chuyển khoản'}</Button>
    </div>
  )
}

function CardForm({ busy, failed, onSubmit }: { busy: boolean; failed: boolean; onSubmit: () => void }) {
  const t = useNow()
  const [f, setF] = useState({ number: '', name: '', exp: '', cvv: '' })
  const [e, setE] = useState<Partial<Record<keyof typeof f, string>>>({})
  const submit = () => {
    const errs: typeof e = {}
    if (!isTestCard(f.number)) errs.number = 'Số thẻ không hợp lệ'
    if (!f.name.trim()) errs.name = 'Vui lòng nhập tên chủ thẻ'
    if (!validExpiry(f.exp, t)) errs.exp = 'Ngày hết hạn không hợp lệ'
    if (!/^\d{3}$/.test(f.cvv)) errs.cvv = 'CVV gồm 3 chữ số'
    setE(errs)
    const first = (['number', 'name', 'exp', 'cvv'] as const).find((k) => errs[k])
    if (first) { document.getElementById(`card-${first}`)?.focus(); return }
    onSubmit()
  }
  const input = (k: keyof typeof f, extra: React.InputHTMLAttributes<HTMLInputElement>, fmt: (s: string) => string = (s) => s) => (
    <input id={`card-${k}`} className={inputClass(!!e[k])} value={f[k]} aria-invalid={!!e[k] || undefined} onChange={(ev) => setF((x) => ({ ...x, [k]: fmt(ev.target.value) }))} {...extra} />
  )
  return (
    <form className="space-y-4" noValidate onSubmit={(ev) => { ev.preventDefault(); submit() }}>
      <p className="rounded-[10px] bg-well p-3 text-[13px] text-ink-2">Bản demo chỉ nhận thẻ thử. Không nhập thẻ thật. Thẻ thử: <span className="tabular font-semibold text-ink">{TEST_CARDS.join(', ')}</span></p>
      <Field label="Số thẻ" htmlFor="card-number" error={e.number}>{input('number', { inputMode: 'numeric', autoComplete: 'off', placeholder: '4111 1111 1111 1111' }, formatCard)}</Field>
      <Field label="Tên chủ thẻ" htmlFor="card-name" error={e.name}>{input('name', { autoComplete: 'off' }, (s) => s.toUpperCase())}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ngày hết hạn" htmlFor="card-exp" error={e.exp}>{input('exp', { inputMode: 'numeric', placeholder: 'MM/YY', autoComplete: 'off' }, (s) => s.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/, '$1/'))}</Field>
        <Field label="CVV" htmlFor="card-cvv" error={e.cvv}>{input('cvv', { inputMode: 'numeric', autoComplete: 'off', maxLength: 3 }, (s) => s.replace(/\D/g, ''))}</Field>
      </div>
      <Button type="submit" size="lg" full loading={busy}>{busy ? 'Đang xử lý…' : failed ? 'Thử lại' : 'Thanh toán'}</Button>
    </form>
  )
}

// US-RET-002 Return request status: /returns/:id
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { addReturnEvidence, delay, markReturnShipped, useNow, useWorld } from '@/app/store'
import { Button, cx, inputClass, PageTitle, Skeleton, useLoaded, vnd } from '@/components/ui'
import { RETURN_LABEL } from '@/domain/orders'
import type { Order, ReturnRequest } from '@/domain/types'
import NotFound from '@/features/demo/NotFound'
import { dmy, dmyhm } from '@/features/ord/logic'
import { CopyButton, LineRow } from '@/features/ord/parts'
import type { World } from '@/mock/seed'
import { expireReturnDeadlines } from './expire'
import { deadlineCopy, reasonLabel, returnSentence, returnTimeline, SOLUTION, validTrackingCode } from './logic'
import { PhotoPicker } from './PhotoPicker'
import { RefundSplitBlock } from './SplitBlock'

export default function ReturnPage() {
  const { id } = useParams()
  const w = useWorld()
  const ready = useLoaded([id])
  const r = w.returns.find((x) => x.id === id)
  const o = r && w.orders.find((x) => x.id === r.orderId)
  if (!r || !o) return <NotFound what="yêu cầu trả hàng" />
  if (!ready) return (
    <div className="mx-auto max-w-[1120px] space-y-4 pb-10 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:space-y-0" aria-busy="true" aria-label="Đang tải yêu cầu">
      <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-48 w-full" /></div><Skeleton className="h-64 w-full" />
    </div>
  )
  return <ReturnDetail r={r} o={o} w={w} />
}

const block = 'rounded-[14px] bg-surface p-4 lg:p-5'
const h2 = 'font-display text-[18px] leading-tight font-semibold'

function ReturnDetail({ r, o, w }: { r: ReturnRequest; o: Order; w: World }) {
  const layout = useLayout()
  const now = useNow()
  useEffect(() => { expireReturnDeadlines() }, [now])
  const shop = w.shops.find((s) => s.id === o.shopId)!
  const { reached, pending } = returnTimeline(r)
  const lines = o.lines.filter((l) => r.lineIds.includes(l.id))
  const refundedAt = r.timeline.find((t) => t.status === 'refunded')?.at
  const evidenceNote = [...r.timeline].reverse().find((t) => t.status === 'needs_evidence')?.note ?? 'Ảnh hiện tại chưa thể hiện rõ vấn đề của sản phẩm. Vui lòng chụp thêm ảnh cận cảnh.'

  const status = (
    <section aria-labelledby="return-status" className={layout === 'app' ? '-mx-4 -mt-4 bg-well px-4 py-5' : block}>
      <h2 id="return-status" className="flex items-center gap-2 font-display text-[22px] leading-tight font-semibold">
        {r.status === 'refunded' && <CheckCircle2 size={22} className="text-jade" aria-hidden />}{RETURN_LABEL[r.status]}
      </h2>
      <p className="mt-1.5 text-[14px] text-ink-2">{returnSentence(r)}</p>
      {r.status === 'refunded' && (
        <div className="mt-3 space-y-1">
          <p className="tabular text-[24px] font-bold">{vnd(r.cash)}</p>
          <p className="text-[14px]">Đã hoàn {vnd(r.cash)} về {r.refundTo.charAt(0).toLowerCase() + r.refundTo.slice(1)}{refundedAt ? ` · ${dmy(refundedAt)}` : ''}</p>
          {r.voucherCredit > 0 && <p className="text-[14px]">Đã hoàn Voucher Market {vnd(r.voucherCredit)} vào Kho voucher</p>}
        </div>
      )}
      {r.status === 'rejected' && r.rejectReason && <p className="mt-2 text-[14px] break-words text-ink">Lý do: {r.rejectReason}</p>}
    </section>
  )

  const panel = r.status === 'needs_evidence' ? <EvidencePanel r={r} note={evidenceNote} />
    : r.status === 'awaiting_return_shipment' ? <ShippingPanel r={r} shopName={shop.name} legalName={shop.legalName} address={shop.businessAddress} now={now} />
      : null

  const timeline = (
    <section aria-labelledby="return-timeline" className={block}>
      <h2 id="return-timeline" className={cx(h2, 'mb-3')}>Tiến trình</h2>
      <ol>
        {reached.map((t, i) => (
          <li key={`${t.status}-${t.at}`} className="flex gap-3 pb-4">
            <span aria-hidden className={cx('mt-[7px] size-2 shrink-0 rounded-full', i === 0 ? 'bg-ink' : 'bg-line-strong')} />
            <div className={cx('text-[13px]', i === 0 ? 'text-ink' : 'text-muted')}>
              <p className={cx(i === 0 && 'font-semibold')}>{RETURN_LABEL[t.status]}</p>
              {t.note && <p>{t.note}</p>}
              <p className="tabular text-[12px]">{dmyhm(t.at)}</p>
            </div>
          </li>
        ))}
        {pending.map((s) => (
          <li key={s} className="flex gap-3 pb-4 last:pb-0">
            <span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full ring-1 ring-line-strong ring-inset" />
            <p className="text-[13px] text-muted">{RETURN_LABEL[s]}<span className="sr-only"> (chưa đến)</span></p>
          </li>
        ))}
      </ol>
    </section>
  )

  const photos = r.photos.slice(0, 5)
  const summary = (
    <section aria-labelledby="return-summary" className="space-y-4">
      <div className={block}>
        <h2 id="return-summary" className={cx(h2, 'mb-3')}>Thông tin yêu cầu</h2>
        <ul className="divide-y divide-line">{lines.map((l) => <li key={l.id} className="py-3 first:pt-0"><LineRow line={l} w={w} link={false} /></li>)}</ul>
        <dl className="mt-3 space-y-2.5 border-t border-line pt-3 text-[14px]">
          <Row label="Mã yêu cầu"><span className="flex items-center gap-2"><span className="tabular font-medium">{r.id}</span><CopyButton text={r.id} /></span></Row>
          <Row label="Lý do">{reasonLabel(r.reason)}</Row>
          {r.description && <Row label="Mô tả"><span className="break-words">{r.description}</span></Row>}
          <Row label="Cách hoàn tiền">{SOLUTION[r.solution].title}</Row>
          <Row label="Hoàn tiền về">{r.refundTo}</Row>
        </dl>
        {r.photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Ảnh bằng chứng">
            {photos.map((p, i) => (
              <li key={i} className="relative aspect-square overflow-hidden rounded-[8px] bg-well">
                <img src={p} alt={`Ảnh ${i + 1}`} className="size-full object-cover" />
                {i === 4 && r.photos.length > 5 && <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[14px] font-semibold text-white">+{r.photos.length - 5}</span>}
              </li>
            ))}
          </ul>
        )}
        <Link to={`/orders/${o.id}`} className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-jade-ink">Xem đơn hàng</Link>
      </div>
      <RefundSplitBlock o={o} lineIds={r.lineIds} cash={r.cash} credit={r.voucherCredit} />
    </section>
  )

  if (layout === 'app')
    return (
      <div className="space-y-3 pb-10">
        <PageTitle className="sr-only">Chi tiết trả hàng</PageTitle>
        {status}{panel}{timeline}{summary}
      </div>
    )
  return (
    <div className="mx-auto max-w-[1120px] pb-12">
      <Link to={`/orders/${o.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-ink-2 no-underline hover:text-ink"><ArrowLeft size={16} aria-hidden />Chi tiết đơn hàng</Link>
      <PageTitle className="mb-5">Chi tiết trả hàng</PageTitle>
      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-8">
        <div className="space-y-4">{status}{panel}{timeline}</div>
        <aside className="sticky top-[132px]">{summary}</aside>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="shrink-0 text-[13px] text-muted">{label}</dt><dd className="min-w-0 text-right">{children}</dd></div>
}

function EvidencePanel({ r, note }: { r: ReturnRequest; note: string }) {
  const [photos, setPhotos] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const send = async () => {
    if (!photos.length) return setError('Vui lòng thêm ít nhất 1 ảnh.')
    setBusy(true); setError('')
    try { await delay(); addReturnEvidence(r.id, photos, 'Bạn đã bổ sung bằng chứng'); setPhotos([]) } catch { setError('Không gửi được. Vui lòng thử lại.') }
    setBusy(false)
  }
  return (
    <section aria-labelledby="evidence" className={block}>
      <h2 id="evidence" className={h2}>Bổ sung bằng chứng</h2>
      <p className="mt-1.5 text-[14px] text-ink-2">{note}</p>
      <div className="mt-3"><PhotoPicker photos={photos} onChange={setPhotos} counted={r.photos.length} /></div>
      {error && <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}
      <Button className="mt-4" loading={busy} onClick={send}>Gửi bổ sung</Button>
    </section>
  )
}

function ShippingPanel({ r, shopName, legalName, address, now }: { r: ReturnRequest; shopName: string; legalName: string; address: string; now: number }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const d = deadlineCopy(r.returnDeadline ?? now, now)
  const send = async () => {
    if (!validTrackingCode(code)) return setError('Mã vận đơn gồm 8–20 chữ cái hoặc chữ số.')
    setBusy(true); setError('')
    // shortcut: markReturnShipped does not store the tracking code; add it to the store action if the code must be shown later.
    try { await delay(); markReturnShipped(r.id) } catch { setError('Không gửi được. Vui lòng thử lại.') }
    setBusy(false)
  }
  return (
    <section aria-labelledby="ship-back" className={block}>
      <h2 id="ship-back" className={h2}>Gửi hàng trả</h2>
      <p className={cx('tabular mt-2 text-[15px] font-semibold', d.urgent ? 'text-jade-ink' : 'text-ink')}>{d.text}</p>
      <div className="mt-3 text-[14px]">
        <p className="text-[13px] text-muted">Địa chỉ trả hàng</p>
        <p className="font-medium break-words">{shopName}</p>
        <p className="text-ink-2">{legalName}</p>
        <p className="text-ink-2">{address}</p>
      </div>
      <div className="mt-4 space-y-1.5">
        <label htmlFor="tracking-code" className="block text-[13px] font-medium text-ink-2">Mã vận đơn</label>
        <input id="tracking-code" value={code} maxLength={20} autoComplete="off" onChange={(e) => { setCode(e.target.value.replace(/\s/g, '')); setError('') }}
          aria-invalid={!!error} aria-describedby={error ? 'tracking-error' : undefined} className={inputClass(!!error)} />
        {error && <p id="tracking-error" role="alert" className="text-[12px] text-danger">{error}</p>}
      </div>
      <Button className="mt-4" loading={busy} onClick={send}>Xác nhận đã gửi hàng</Button>
    </section>
  )
}

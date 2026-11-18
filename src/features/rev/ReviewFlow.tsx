// US-REV-001 Write a review for a delivered order: /orders/:id/review
import { ArrowLeft, ChevronDown, Star } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { editReview, submitReviews, useNow, useWorld } from '@/app/store'
import { Button, Chip, Confirm, cx, Img, PageTitle, Skeleton, Stars, toast, useLoaded } from '@/components/ui'
import type { Order, OrderLine, Review } from '@/domain/types'
import NotFound from '@/features/demo/NotFound'
import { dmy, reviewPrompt } from '@/features/ord/logic'
import { PhotoPicker } from '@/features/ret/PhotoPicker'
import type { World } from '@/mock/seed'
import { canEditReview, emptyReview, isDirty, maskName, pruneTags, STAR_LABEL, SUB_RATINGS, tagsFor, TEXT_MAX, type ReviewDraft } from './logic'

export default function ReviewFlow() {
  const { id } = useParams()
  const w = useWorld()
  const ready = useLoaded([id])
  const o = w.orders.find((x) => x.id === id)
  if (!o) return <NotFound what="đơn hàng" />
  if (!ready) return <div className="mx-auto max-w-[720px] space-y-4 pb-10" role="status" aria-busy="true" aria-label="Đang tải"><Skeleton className="h-8 w-56" /><Skeleton className="h-64 w-full" /></div>
  return <ReviewForm o={o} w={w} />
}

const num = (n: number) => n.toLocaleString('vi-VN')

function StarInput({ value, onChange, label, size }: { value: number; onChange: (n: number) => void; label: string; size: number }) {
  const name = useId()
  return (
    <fieldset className="flex items-center gap-3">
      <legend className="sr-only">{label}</legend>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <label key={i} className="cursor-pointer p-0.5">
            <input type="radio" name={name} value={i} checked={value === i} onChange={() => onChange(i)} aria-label={`${i} sao`} className="peer sr-only" />
            <Star size={size} strokeWidth={1.4} aria-hidden className={cx('rounded-[4px] peer-focus-visible:outline-2 peer-focus-visible:outline-accent', i <= value ? 'fill-accent text-accent' : 'fill-transparent text-line-strong')} />
          </label>
        ))}
      </span>
      {value > 0 && <span className="text-[14px] font-medium text-accent-ink">{STAR_LABEL[value]}</span>}
    </fieldset>
  )
}

function LineHead({ line }: { line: OrderLine }) {
  return (
    <div className="flex gap-3">
      <Img src={line.image} alt="" className="size-14 shrink-0 rounded-[var(--radius-control)]" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-[14px] leading-snug" title={line.name}>{line.name}</p>
        {line.variantText && <p className="mt-0.5 text-[12px] text-muted">Phân loại: {line.variantText}</p>}
      </div>
    </div>
  )
}

function ReviewBlock({ line, d, set, starSize }: { line: OrderLine; d: ReviewDraft; set: (p: Partial<ReviewDraft>) => void; starSize: number }) {
  const [detail, setDetail] = useState(Object.values(d.sub).some(Boolean))
  const textId = useId()
  return (
    <div className="space-y-4">
      <LineHead line={line} />
      <StarInput value={d.rating} size={starSize} label={`Đánh giá ${line.name}`} onChange={(n) => set({ rating: n, tags: pruneTags(d.tags, n) })} />
      {d.rating > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Thẻ nhanh" role="group">
          {tagsFor(d.rating).map((t) => <Chip key={t} selected={d.tags.includes(t)} onClick={() => set({ tags: d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t] })}>{t}</Chip>)}
        </div>
      )}
      <div>
        <button type="button" aria-expanded={detail} onClick={() => setDetail((v) => !v)} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-accent-ink">
          Thêm đánh giá chi tiết<ChevronDown size={16} aria-hidden className={cx('transition-transform', detail && 'rotate-180')} />
        </button>
        {detail && (
          <div className="mt-1 space-y-2">
            {SUB_RATINGS.map(([k, label]) => (
              <div key={k} className="flex flex-wrap items-center justify-between gap-x-4">
                <span className="text-[13px] text-ink-2">{label}</span>
                <StarInput value={d.sub[k] ?? 0} size={22} label={label} onChange={(n) => set({ sub: { ...d.sub, [k]: n } })} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label htmlFor={textId} className="sr-only">Nhận xét</label>
        <textarea id={textId} rows={4} maxLength={TEXT_MAX} value={d.text} onChange={(e) => set({ text: e.target.value })} placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé"
          className="w-full resize-y rounded-[var(--radius-control)] bg-surface px-3.5 py-2.5 text-[14px] leading-[1.6] ring-1 ring-line-strong outline-none ring-inset focus:ring-2 focus:ring-accent" />
        <p className="text-right text-[12px] text-muted tabular">{num(d.text.length)}/{num(TEXT_MAX)}</p>
      </div>
      <PhotoPicker photos={d.photos} onChange={(photos) => set({ photos })} />
    </div>
  )
}

function ReadOnlyReview({ line, r, onEdit }: { line: OrderLine; r: Review; onEdit?: () => void }) {
  return (
    <div className="space-y-2.5">
      <LineHead line={line} />
      <div className="flex items-center gap-2"><Stars value={r.rating} size={16} /><span className="text-[13px] text-muted">{STAR_LABEL[r.rating]}{r.editedAt && ' · Đã chỉnh sửa'}</span></div>
      {r.tags.length > 0 && <ul className="flex flex-wrap gap-1.5">{r.tags.map((t) => <li key={t} className="rounded-[4px] bg-accent-soft px-2 py-0.5 text-[12px] text-accent-ink">{t}</li>)}</ul>}
      {r.text && <p className="text-[14px] break-words whitespace-pre-line">{r.text}</p>}
      {r.photos.length > 0 && <div className="flex flex-wrap gap-2">{r.photos.map((p, i) => <img key={i} src={p} alt={`Ảnh ${i + 1}`} className="size-16 rounded-[var(--radius-control)] bg-well object-cover" />)}</div>}
      {r.shopReply && <div className="rounded-[var(--radius-control)] bg-ground px-3.5 py-2.5 text-[13px]"><p className="font-semibold">Shop đã phản hồi</p><p className="mt-0.5 text-ink-2">{r.shopReply.text}</p></div>}
      {onEdit && <Button variant="secondary" size="sm" onClick={onEdit}>Sửa đánh giá</Button>}
    </div>
  )
}

function ReviewForm({ o, w }: { o: Order; w: World }) {
  const layout = useLayout()
  const nav = useNavigate()
  const now = useNow()
  const prompt = reviewPrompt(o, now)
  const windowOpen = prompt.kind !== 'none' && !!prompt.until && now < prompt.until
  const reviewed = o.lines.filter((l) => l.reviewId)
  const allowed = prompt.kind !== 'none' && (windowOpen || reviewed.length > 0)
  const told = useRef(false)
  useEffect(() => {
    if (!allowed && !told.current) { told.current = true; toast('Đơn hàng này không thể đánh giá.'); nav(`/orders/${o.id}`, { replace: true }) }
  }, [allowed]) // eslint-disable-line react-hooks/exhaustive-deps

  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({})
  const [editing, setEditing] = useState<Record<string, string>>({}) // lineId → reviewId
  const [anonymous, setAnonymous] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [leave, setLeave] = useState(false)
  const draftOf = (lineId: string) => drafts[lineId] ?? emptyReview()
  const set = (lineId: string) => (p: Partial<ReviewDraft>) => setDrafts((d) => ({ ...d, [lineId]: { ...(d[lineId] ?? emptyReview()), ...p } }))
  const dirty = Object.values(drafts).some(isDirty)
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const reviewOf = (l: OrderLine) => w.reviews.find((r) => r.id === l.reviewId)
  const open = windowOpen ? o.lines.filter((l) => !l.reviewId) : []
  const canSend = [...open, ...o.lines.filter((l) => editing[l.id])].some((l) => draftOf(l.id).rating > 0)
  const editable = windowOpen && reviewed.some((l) => { const r = reviewOf(l); return r && canEditReview(r) })
  const allDone = !open.length && !editable && !Object.keys(editing).length

  const startEdit = (l: OrderLine, r: Review) => {
    setEditing((e) => ({ ...e, [l.id]: r.id }))
    setDrafts((d) => ({ ...d, [l.id]: { rating: r.rating, sub: r.sub ?? {}, tags: r.tags, text: r.text, photos: r.photos } }))
  }
  const submit = async () => {
    setBusy(true); setError('')
    try {
      const fresh = open.filter((l) => draftOf(l.id).rating > 0).map((l) => { const d = draftOf(l.id); return { lineId: l.id, rating: d.rating, sub: d.sub, tags: d.tags, text: d.text, photos: d.photos, anonymous } })
      if (fresh.length) await submitReviews(o.id, fresh)
      for (const [lineId, reviewId] of Object.entries(editing)) {
        const d = draftOf(lineId)
        if (d.rating) editReview(reviewId, { rating: d.rating, text: d.text.trim(), tags: d.tags, photos: d.photos })
      }
      setDrafts({})
      toast('Cảm ơn bạn đã đánh giá!')
      nav(`/orders/${o.id}`)
    } catch { setError('Không gửi được đánh giá. Vui lòng thử lại.') }
    setBusy(false)
  }
  const back = () => (dirty ? setLeave(true) : nav(`/orders/${o.id}`))
  const starSize = layout === 'app' ? 40 : 32

  return (
    <div className={cx('mx-auto max-w-[720px]', allDone ? 'pb-10' : 'pb-4')}>
      {layout === 'web' && <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-ink-2 hover:text-accent-ink"><ArrowLeft size={16} aria-hidden />Chi tiết đơn hàng</button>}
      <PageTitle className={layout === 'app' ? 'sr-only' : 'mb-2'}>Đánh giá sản phẩm</PageTitle>
      {prompt.until && windowOpen && <p className="text-[13px] text-muted">Bạn có thể đánh giá đến hết ngày {dmy(prompt.until)}.</p>}
      <div className="mt-3 space-y-2 lg:space-y-3">
        {open.map((l) => <section key={l.id} aria-label={l.name} className="panel p-3 lg:p-6"><ReviewBlock line={l} d={draftOf(l.id)} set={set(l.id)} starSize={starSize} /></section>)}
        {reviewed.map((l) => {
          const r = reviewOf(l)
          if (!r) return null
          return (
            <section key={l.id} aria-label={l.name} className="panel p-3 lg:p-6">
              {editing[l.id] ? <ReviewBlock line={l} d={draftOf(l.id)} set={set(l.id)} starSize={starSize} />
                : <ReadOnlyReview line={l} r={r} onEdit={windowOpen && canEditReview(r) ? () => startEdit(l, r) : undefined} />}
            </section>
          )
        })}
      </div>
      {allDone && <p className="mt-4 text-center text-[14px] text-ink-2">Bạn đã đánh giá tất cả sản phẩm trong đơn hàng này.</p>}
      {!allDone && (
        <div className={cx('sticky bottom-0 z-30 mt-4 bg-surface py-3 shadow-[var(--shadow-bar)]', layout === 'app' ? '-mx-3 px-3 pb-[max(12px,env(safe-area-inset-bottom))]' : 'rounded-t-[var(--radius-card)] px-6')}>
          {error && <p role="alert" className="mb-2 text-[13px] text-danger">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <button type="button" role="switch" aria-checked={anonymous} onClick={() => setAnonymous((v) => !v)} className="inline-flex min-h-11 items-center gap-2.5 text-[14px]">
                <span aria-hidden className={cx('relative h-6 w-10 rounded-full transition-colors', anonymous ? 'bg-accent' : 'bg-line-strong')}>
                  <span className={cx('absolute top-0.5 size-5 rounded-full bg-white transition-[left]', anonymous ? 'left-[18px]' : 'left-0.5')} />
                </span>
                Đánh giá ẩn danh
              </button>
              {anonymous && <p className="text-[12px] text-muted">Tên của bạn sẽ hiển thị là {maskName(w.buyer.name)}</p>}
            </div>
            <Button size="lg" loading={busy} disabled={!canSend} onClick={submit} className={cx(layout === 'app' && 'flex-1')}>Gửi đánh giá</Button>
          </div>
        </div>
      )}
      <Confirm open={leave} onOpenChange={setLeave} title="Bỏ đánh giá đang viết?" body="Nội dung bạn vừa nhập sẽ không được lưu."
        cancelLabel="Tiếp tục viết" confirmLabel="Bỏ" onConfirm={() => { setLeave(false); setDrafts({}); nav(`/orders/${o.id}`) }} />
    </div>
  )
}

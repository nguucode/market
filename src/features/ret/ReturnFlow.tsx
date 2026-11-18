// US-RET-001 Request a return or refund: /orders/:id/return?step=items|reason|evidence|refund|confirm|result
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { submitReturn, useNow, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, PageTitle, Radio } from '@/components/ui'
import { returnWindowEnds } from '@/domain/orders'
import type { Order } from '@/domain/types'
import NotFound from '@/features/demo/NotFound'
import { CopyButton, LineRow, ShopName } from '@/features/ord/parts'
import type { World } from '@/mock/seed'
import {
  activeSteps, allowedSolutions, DESCRIPTION_MAX, emptyDraft, evidenceRequired, nextStep, prevStep, REASONS, reasonLabel, resolveStep, returnDestinationCopy, SOLUTION, STEP_LABEL, stepError, STEPS,
  type Draft, type Step,
} from './logic'
import { PhotoPicker } from './PhotoPicker'
import { RefundSplitBlock } from './SplitBlock'

// shortcut: drafts live in memory per order id, so back/forward keeps choices and a reload restarts at "Sản phẩm" (the story asks for that).
const drafts = new Map<string, Draft>()

export default function ReturnFlow() {
  const { id = '' } = useParams()
  const w = useWorld()
  const o = w.orders.find((x) => x.id === id)
  if (!o) return <NotFound what="đơn hàng" />
  return <Flow o={o} w={w} />
}

function Flow({ o, w }: { o: Order; w: World }) {
  const layout = useLayout()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const [draft, setDraftState] = useState<Draft>(() => drafts.get(o.id) ?? emptyDraft(o.lines.length === 1 ? [o.lines[0].id] : []))
  const setDraft = (patch: Partial<Draft>) => setDraftState((d) => { const n = { ...d, ...patch }; drafts.set(o.id, n); return n })
  const step = resolveStep(params.get('step'), draft)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Only sync ?step while this flow will render; otherwise the redirects below must win (setParams would undo them).
  const redirecting = (!!draft.submittedId && step !== 'result') || (!!o.returnId && !draft.submittedId) || (!draft.submittedId && o.status !== 'delivered' && o.status !== 'completed')
  useEffect(() => { if (!redirecting && params.get('step') !== step) setParams({ step }, { replace: true }) }, [step, redirecting]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setError(''), [step])

  if (draft.submittedId && step !== 'result') return <Navigate to={`/returns/${draft.submittedId}`} replace />
  if (o.returnId && !draft.submittedId) return <Navigate to={`/returns/${o.returnId}`} replace />
  if (!draft.submittedId && o.status !== 'delivered' && o.status !== 'completed') return <Navigate to={`/orders/${o.id}`} replace />

  const deadline = returnWindowEnds(o) ?? 0
  const expired = now >= deadline
  const go = (s: Step) => setParams({ step: s })
  const next = async () => {
    if (step === 'result') return
    const e = stepError(step, draft)
    if (e) return setError(e)
    if (step !== 'confirm') return go(nextStep(step, draft))
    setBusy(true); setError('')
    try {
      const rid = await submitReturn({ orderId: o.id, lineIds: draft.lineIds, reason: draft.reason!, description: draft.description.trim(), photos: evidenceRequired(draft.reason) ? draft.photos : [], solution: draft.solution! })
      setDraft({ submittedId: rid })
      setParams({ step: 'result' }, { replace: true })
    } catch { setError('Không gửi được yêu cầu. Vui lòng thử lại.') }
    setBusy(false)
  }
  const back = prevStep(step, draft)
  const steps = activeSteps(draft)

  if (step === 'result') {
    drafts.delete(o.id)
    return (
      <div className="panel mx-auto max-w-[640px] px-5 py-10 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden><CheckCircle2 size={32} /></span>
        <PageTitle className="mt-4">Đã gửi yêu cầu trả hàng/hoàn tiền</PageTitle>
        <p className="mt-2 text-[14px] text-ink-2">Market sẽ phản hồi trong 3–5 ngày làm việc.</p>
        <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-muted">Mã yêu cầu <span className="tabular font-medium text-ink">{draft.submittedId}</span><CopyButton text={draft.submittedId!} /></p>
        <ButtonLink to={`/returns/${draft.submittedId}`} className="mt-6">Xem chi tiết</ButtonLink>
      </div>
    )
  }

  const indicator = layout === 'app' ? (
    <p className="text-[13px] font-medium text-ink-2">Bước {steps.indexOf(step) + 1}/{steps.length} · {STEP_LABEL[step]}</p>
  ) : (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" aria-label="Các bước">
      {STEPS.map((s, i) => {
        const skipped = !steps.includes(s)
        return (
          <li key={s} className="flex items-center gap-2" aria-current={s === step ? 'step' : undefined}>
            {i > 0 && <span aria-hidden className="text-line-strong">·</span>}
            <span className={cx(s === step ? 'font-semibold text-accent-ink' : 'text-muted')}>{i + 1} {STEP_LABEL[s]}{skipped && ' (Không cần)'}</span>
          </li>
        )
      })}
    </ol>
  )

  const footer = (
    <>
      {error && <p role="alert" className="mb-2 text-[13px] text-danger">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        {layout === 'web' && (back ? <Button variant="ghost" onClick={() => go(back)}>Quay lại</Button> : <span />)}
        <Button size="lg" full={layout === 'app'} loading={busy} disabled={(step === 'items' && !draft.lineIds.length) || (step === 'confirm' && expired)} onClick={next}>
          {step === 'confirm' ? 'Gửi yêu cầu' : 'Tiếp tục'}
        </Button>
      </div>
    </>
  )

  return (
    <div className={cx('mx-auto max-w-[640px]', layout === 'app' ? 'pb-28' : 'pb-12')}>
      <div className="panel px-4 py-3 lg:px-5 lg:py-4">
        <PageTitle className={layout === 'app' ? 'sr-only' : undefined}>Yêu cầu trả hàng/hoàn tiền</PageTitle>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted lg:mt-2"><ShopName w={w} shopId={o.shopId} link={false} className="text-[13px]" /><span>· Đơn {o.id}</span></div>
        <div className="mt-3 border-t border-line pt-3">{indicator}</div>
      </div>
      <section className="mt-3" aria-label={STEP_LABEL[step]}>
        {step === 'items' && <ItemsStep o={o} w={w} draft={draft} setDraft={setDraft} />}
        {step === 'reason' && <ReasonStep draft={draft} setDraft={setDraft} />}
        {step === 'evidence' && (
          <Group title="Bằng chứng" hint="Thêm 1 đến 5 ảnh cho thấy rõ sản phẩm và vấn đề.">
            <PhotoPicker photos={draft.photos} onChange={(photos) => { setDraft({ photos }); setError('') }} samples={o.lines.filter((l) => draft.lineIds.includes(l.id)).map((l) => l.image)} tile="size-24" />
          </Group>
        )}
        {step === 'refund' && <RefundStep o={o} draft={draft} setDraft={setDraft} />}
        {step === 'confirm' && <ConfirmStep o={o} w={w} draft={draft} expired={expired} />}
      </section>
      {layout === 'app'
        ? <div className="fixed inset-x-0 bottom-0 z-40 bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar)]">{footer}</div>
        : <div className="panel mt-3 px-5 py-4">{footer}</div>}
    </div>
  )
}

function Group({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="panel space-y-3 p-4 lg:p-5">
      <div><h2 className="font-display text-[18px]">{title}</h2>{hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}</div>
      {children}
    </div>
  )
}

type StepProps = { draft: Draft; setDraft: (p: Partial<Draft>) => void }

function ItemsStep({ o, w, draft, setDraft }: StepProps & { o: Order; w: World }) {
  const toggle = (id: string, on: boolean) => setDraft({ lineIds: on ? [...draft.lineIds, id] : draft.lineIds.filter((x) => x !== id) })
  return (
    <Group title="Chọn sản phẩm cần trả" hint="Trả nguyên dòng sản phẩm, theo số lượng đã mua.">
      <ul className="divide-y divide-line">
        {o.lines.map((l) => (
          <li key={l.id}>
            <label className="flex cursor-pointer items-start gap-3 py-3.5">
              <input type="checkbox" checked={draft.lineIds.includes(l.id)} onChange={(e) => toggle(l.id, e.target.checked)} className="mt-6 size-5 shrink-0 accent-[var(--color-accent)]" aria-label={l.name} />
              <LineRow line={l} w={w} link={false} className="min-w-0 flex-1" />
            </label>
          </li>
        ))}
      </ul>
    </Group>
  )
}

function ReasonStep({ draft, setDraft }: StepProps) {
  return (
    <Group title="Lý do trả hàng">
        <fieldset className="space-y-2">
          <legend className="sr-only">Lý do trả hàng</legend>
          {REASONS.map((r) => (
            <Radio key={r.id} name="return-reason" checked={draft.reason === r.id} onChange={() => setDraft({ reason: r.id, solution: allowedSolutions(r.id).includes(draft.solution!) ? draft.solution : undefined })}>
              <span className="text-[14px]">{r.label}</span>
            </Radio>
          ))}
        </fieldset>
      {draft.reason === 'changed_mind' && (
        <div className="space-y-1 rounded-[var(--radius-control)] bg-well px-4 py-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[14px]">
            <input type="checkbox" checked={draft.intact} onChange={(e) => setDraft({ intact: e.target.checked })} className="size-5 shrink-0 accent-[var(--color-accent)]" />
            Sản phẩm còn nguyên tem, nhãn và bao bì
          </label>
          <p className="pb-1 text-[13px] text-ink-2">Market không hỗ trợ đổi hàng, chỉ hoàn tiền.</p>
        </div>
      )}
      <div className="pt-2">
        <label htmlFor="return-desc" className="mb-1.5 block text-[13px] font-medium text-ink-2">Mô tả chi tiết</label>
        <textarea id="return-desc" rows={4} maxLength={DESCRIPTION_MAX} value={draft.description} onChange={(e) => setDraft({ description: e.target.value })}
          className="w-full resize-y rounded-[var(--radius-control)] bg-surface px-3.5 py-2.5 text-[14px] leading-relaxed ring-1 ring-line-strong outline-none ring-inset focus:ring-2 focus:ring-accent" />
        <p className="text-right text-[12px] text-muted tabular">{draft.description.length}/{DESCRIPTION_MAX}</p>
      </div>
    </Group>
  )
}

function RefundStep({ o, draft, setDraft }: StepProps & { o: Order }) {
  return (
    <Group title="Cách hoàn tiền">
        <div className="space-y-2">
          {allowedSolutions(draft.reason).map((s) => (
            <Radio key={s} name="solution" checked={draft.solution === s} onChange={() => setDraft({ solution: s })}>
              <span className="block text-[15px] font-semibold">{SOLUTION[s].title}</span>
              <span className="mt-0.5 block text-[13px] text-ink-2">{SOLUTION[s].body}</span>
            </Radio>
          ))}
        </div>
      <div className="border-t border-line pt-3">
        <h3 className="text-[13px] font-medium text-muted">Hoàn tiền về</h3>
        <p className="mt-1 text-[14px]">{returnDestinationCopy(o.paymentMethod)}</p>
      </div>
    </Group>
  )
}

function ConfirmStep({ o, w, draft, expired }: { o: Order; w: World; draft: Draft; expired: boolean }) {
  const [more, setMore] = useState(false)
  const lines = o.lines.filter((l) => draft.lineIds.includes(l.id))
  const dt = 'text-[13px] text-muted'
  return (
    <div className="space-y-3">
      {expired && <p role="alert" className="rounded-[var(--radius-card)] bg-danger-soft px-4 py-3 text-[14px] font-medium text-danger">Đã hết hạn yêu cầu trả hàng/hoàn tiền.</p>}
      <Group title="Kiểm tra yêu cầu">
        <ul className="divide-y divide-line">{lines.map((l) => <li key={l.id} className="py-3"><LineRow line={l} w={w} link={false} /></li>)}</ul>
      </Group>
      <dl className="panel space-y-3 p-4 text-[14px] lg:p-5">
        <div><dt className={dt}>Lý do</dt><dd>{reasonLabel(draft.reason!)}</dd></div>
        {draft.description.trim() && (
          <div>
            <dt className={dt}>Mô tả chi tiết</dt>
            <dd className={cx('break-words whitespace-pre-line', !more && 'line-clamp-3')}>{draft.description}</dd>
            {draft.description.length > 160 && <Button variant="link" className="mt-1 text-[13px]" onClick={() => setMore((v) => !v)}>{more ? 'Thu gọn' : 'Xem thêm'}</Button>}
          </div>
        )}
        {evidenceRequired(draft.reason) && (
          <div><dt className={dt}>Ảnh</dt><dd className="mt-1 flex flex-wrap gap-2">{draft.photos.map((p, i) => <img key={i} src={p} alt={`Ảnh ${i + 1}`} className="size-14 rounded-[8px] object-cover" />)}</dd></div>
        )}
        <div><dt className={dt}>Cách hoàn tiền</dt><dd>{SOLUTION[draft.solution!].title}</dd></div>
        <div><dt className={dt}>Hoàn tiền về</dt><dd>{returnDestinationCopy(o.paymentMethod)}</dd></div>
      </dl>
      <RefundSplitBlock o={o} lineIds={draft.lineIds} />
    </div>
  )
}

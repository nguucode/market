// Shared UI kit: US-FND-008 (sheets), US-FND-009 (states), US-FND-010 (toasts, confirm), the money fold (direction contract).
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, Check, ChevronDown, Loader2, Minus, Plus, Star, X } from 'lucide-react'
import { forwardRef, useEffect, useId, useState, useSyncExternalStore, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { discountPct, signedVnd, vnd, vndSpoken } from '@/domain/money'

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ')

/* ── Buttons ──────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'jade' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-cta text-ground hover:bg-ink-2 disabled:bg-line-strong disabled:text-surface',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-ink/80 hover:bg-well disabled:text-muted disabled:ring-line',
  ghost: 'text-ink hover:bg-well disabled:text-muted',
  jade: 'bg-jade text-white hover:bg-jade-ink disabled:bg-line-strong',
  danger: 'bg-danger text-white hover:brightness-95 disabled:bg-line-strong',
  link: 'text-jade-ink underline-offset-4 hover:underline px-0! h-auto! font-semibold',
}
const SIZE: Record<Size, string> = { sm: 'h-9 px-4 text-[13px]', md: 'h-11 px-5 text-[14px]', lg: 'h-12 px-6 text-[15px]' }
export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', full?: boolean) =>
  cx('inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline transition-[background-color,box-shadow,color] duration-150 disabled:cursor-not-allowed select-none', VARIANT[variant], SIZE[size], full && 'w-full')

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; full?: boolean; loading?: boolean }>(
  function Button({ variant, size, full, loading, className, children, disabled, type = 'button', ...rest }, ref) {
    return (
      <button ref={ref} type={type} className={cx(buttonClass(variant, size, full), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {children}
      </button>
    )
  },
)
export function ButtonLink({ variant, size, full, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <Link className={cx(buttonClass(variant, size, full), className)} {...rest} />
}
export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-well', className)} {...rest}>
      {children}
    </button>
  )
}

/** Toggle chip (filters, variant options). */
export function Chip({ selected, disabled, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cx(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors',
        selected ? 'bg-jade-soft text-jade-ink ring-1 ring-inset ring-jade' : 'bg-surface text-ink ring-1 ring-inset ring-line hover:ring-line-strong',
        disabled && 'cursor-not-allowed text-muted line-through decoration-muted/60 opacity-70 hover:ring-line',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SampleBadge({ className, onClick }: { className?: string; onClick?: () => void }) {
  const cls = cx('inline-flex h-6 items-center rounded-full bg-well px-2.5 text-[11px] font-semibold whitespace-nowrap text-ink-2', className)
  return onClick ? <button type="button" onClick={onClick} className={cls} aria-label="Dữ liệu mẫu, mở Demo controls">Dữ liệu mẫu</button> : <span className={cls}>Dữ liệu mẫu</span>
}

/* ── Text & layout helpers ────────────────────────────────────────── */

export function PageTitle({ children, className, serif = true }: { children: ReactNode; className?: string; serif?: boolean }) {
  return <h1 data-page-title tabIndex={-1} className={cx(serif ? 'font-display text-[26px] leading-[1.15] font-semibold lg:text-[32px]' : 'text-[18px] font-semibold', className)}>{children}</h1>
}
export function SectionHead({ title, action, id, className }: { title: ReactNode; action?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={cx('mb-3 flex items-end justify-between gap-4', className)}>
      <h2 id={id} className="font-display text-[20px] leading-tight font-semibold lg:text-[24px]">{title}</h2>
      {action}
    </div>
  )
}

/* ── Price ────────────────────────────────────────────────────────── */

/** Price with optional struck price and discount: rules.md#price-display (deal colour is jade, never red). */
export function Price({ price, before, size = 'md', range, showStruck = true, className }: { price: number; before?: number; size?: 'sm' | 'md' | 'lg' | 'xl'; range?: [number, number]; showStruck?: boolean; className?: string }) {
  const pct = discountPct(price, before)
  const deal = pct > 0
  const big = { sm: 'text-[14px]', md: 'text-[16px]', lg: 'text-[22px]', xl: 'text-[28px] lg:text-[30px]' }[size]
  return (
    <span className={cx('inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cx('tabular font-bold', big, deal ? 'text-jade' : 'text-ink')}>
        {range && range[0] !== range[1] ? <>{vnd(range[0])}<span className="mx-1 font-normal text-muted">–</span>{vnd(range[1])}</> : vnd(price)}
      </span>
      {deal && showStruck && (
        <>
          <s className="tabular text-[13px] text-muted"><span className="sr-only">Giá trước khuyến mãi </span>{vnd(before!)}</s>
          <span className="text-[13px] font-semibold text-jade-ink">-{pct}%</span>
        </>
      )}
    </span>
  )
}

/** The rating glyph: the icon library's star, filled, sized to the text. */
export function RatingStar({ className }: { className?: string }) {
  return <Star size={12} strokeWidth={0} aria-hidden className={cx('inline-block shrink-0 fill-current align-[-1px]', className)} />
}
/** Rating number with a drawn star and count; screen readers hear "4,6 sao". */
export function RatingText({ value, count, className }: { value: number; count?: string; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1', className)}>
      {value.toLocaleString('vi-VN')}<RatingStar /><span className="sr-only">sao</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  )
}

export function Stars({ value, size = 14, count, className }: { value: number; size?: number; count?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 text-[13px]', className)}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} strokeWidth={1.5} className={i <= Math.round(value) ? 'fill-ink text-ink' : 'fill-transparent text-line-strong'} />
        ))}
      </span>
      <span className="sr-only">{value.toLocaleString('vi-VN')} trên 5 sao</span>
      {count !== undefined && <span className="text-muted">({count.toLocaleString('vi-VN')})</span>}
    </span>
  )
}

/* ── The money fold (signature move) ──────────────────────────────── */

export type FoldLine = { label: ReactNode; amount: number; note?: ReactNode; tone?: 'minus' | 'plus' | 'base' }
/**
 * A total that unfolds into its ledger: goods, each voucher by name, shipping.
 * `split` draws how a session total divides across shop orders.
 */
export function MoneyFold({ label = 'Tổng thanh toán', total, lines, split, defaultOpen, footnote, className, size = 'lg' }: {
  label?: ReactNode; total: number; lines: FoldLine[]; split?: { name: string; amount: number }[]; defaultOpen?: boolean; footnote?: ReactNode; className?: string; size?: 'md' | 'lg'
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const id = useId()
  const sum = split?.reduce((a, s) => a + s.amount, 0) ?? 0
  return (
    <div className={className}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="group flex w-full items-center justify-between gap-3 text-left">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2">
          {label}
          <ChevronDown size={16} aria-hidden className={cx('transition-transform duration-200', open && 'rotate-180')} />
          <span className="sr-only">{open ? 'Thu gọn chi tiết' : 'Xem chi tiết'}</span>
        </span>
        <span className={cx('tabular font-bold', size === 'lg' ? 'text-[22px]' : 'text-[17px]')} aria-label={vndSpoken(total)}>{vnd(total)}</span>
      </button>
      {open && (
        <div id={id} className="mt-3 border-t border-dashed border-line-strong pt-3 motion-safe:animate-[fold-open_220ms_var(--ease-out-expo)]">
          <dl className="space-y-1.5 text-[13px]">
            {lines.map((l, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <dt className="min-w-0 text-ink-2">{l.label}{l.note && <span className="block text-[12px] text-muted">{l.note}</span>}</dt>
                <dd className={cx('tabular shrink-0', l.tone === 'minus' ? 'text-jade-ink' : 'text-ink')}>{l.tone === 'minus' ? signedVnd(-Math.abs(l.amount)) : vnd(l.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold"><dt>{label}</dt><dd className="tabular">{vnd(total)}</dd></div>
          </dl>
          {split && split.length > 1 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[12px] text-muted">Chia thành {split.length} đơn, mỗi shop một đơn</p>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-well" aria-hidden>
                {split.map((s, i) => <span key={i} style={{ width: `${(s.amount / (sum || 1)) * 100}%` }} className={cx('h-full', i % 2 ? 'bg-jade/45' : 'bg-jade')} />)}
              </div>
              <ul className="mt-2 space-y-1 text-[12px]">
                {split.map((s, i) => <li key={i} className="flex justify-between gap-3"><span className="truncate text-ink-2">{s.name}</span><span className="tabular">{vnd(s.amount)}</span></li>)}
              </ul>
            </div>
          )}
          {footnote && <p className="mt-2 text-[12px] text-muted">{footnote}</p>}
        </div>
      )}
    </div>
  )
}

/* ── Inputs ───────────────────────────────────────────────────────── */

export function QtyStepper({ value, min = 1, max, onChange, label = 'Số lượng', disabled }: { value: number; min?: number; max: number; onChange: (n: number) => void; label?: string; disabled?: boolean }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = (s: string) => {
    const n = Math.max(min, Math.min(max, Number.parseInt(s, 10) || min))
    setDraft(String(n)); if (n !== value) onChange(n)
  }
  return (
    <div role="group" aria-label={label} className="inline-flex h-9 items-center rounded-full ring-1 ring-inset ring-line-strong">
      <button type="button" aria-label="Giảm" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} className="flex size-9 items-center justify-center rounded-full disabled:text-line-strong hover:enabled:bg-well"><Minus size={14} aria-hidden /></button>
      <input aria-label={label} inputMode="numeric" disabled={disabled} value={draft} onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)} className="tabular w-10 bg-transparent text-center text-[14px] outline-none" />
      <button type="button" aria-label="Tăng" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className="flex size-9 items-center justify-center rounded-full disabled:text-line-strong hover:enabled:bg-well"><Plus size={14} aria-hidden /></button>
    </div>
  )
}

export function Field({ label, hint, error, children, htmlFor, required }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2">{label}{required && <span className="text-danger" aria-hidden> *</span>}</label>
      {children}
      {error ? <p className="flex items-center gap-1 text-[12px] text-danger" role="alert"><AlertCircle size={13} aria-hidden />{error}</p> : hint && <p className="text-[12px] text-muted">{hint}</p>}
    </div>
  )
}
export const inputClass = (invalid?: boolean) =>
  cx('h-11 w-full rounded-[10px] bg-surface px-3.5 text-[14px] ring-1 ring-inset outline-none transition-shadow focus:ring-2 focus:ring-jade', invalid ? 'ring-danger' : 'ring-line-strong')

export function Checkbox({ checked, onChange, label, disabled, indeterminate, className }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean; indeterminate?: boolean; className?: string }) {
  return (
    <label className={cx('inline-flex min-h-11 cursor-pointer items-center gap-2.5 select-none', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="relative inline-flex size-5 shrink-0">
        <input type="checkbox" className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-[6px] bg-surface ring-1 ring-inset ring-line-strong checked:bg-jade checked:ring-jade disabled:cursor-not-allowed" checked={checked} disabled={disabled}
          ref={(el) => { if (el) el.indeterminate = !!indeterminate }} onChange={(e) => onChange(e.target.checked)} />
        <Check size={14} strokeWidth={3} aria-hidden className="pointer-events-none absolute inset-[3px] text-white opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="text-[14px]">{label}</span>
    </label>
  )
}

export function Radio({ name, checked, onChange, children, disabled, className }: { name: string; checked: boolean; onChange: () => void; children: ReactNode; disabled?: boolean; className?: string }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-3 rounded-[12px] p-3.5 ring-1 ring-inset transition-colors', checked ? 'bg-jade-soft/50 ring-jade' : 'bg-surface ring-line hover:ring-line-strong', disabled && 'cursor-not-allowed opacity-60 hover:ring-line', className)}>
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} className="mt-0.5 size-[18px] shrink-0 accent-[var(--color-jade)]" />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}

/* ── Tabs (link or button driven) ─────────────────────────────────── */

export function Tabs<T extends string>({ items, value, onChange, label, className }: { items: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cx('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}>
      {items.map((t) => (
        <button key={t.id} role="tab" type="button" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cx('relative flex h-11 shrink-0 items-center gap-1.5 px-3 text-[14px] whitespace-nowrap', value === t.id ? 'font-semibold text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-ink' : 'text-muted hover:text-ink')}>
          {t.label}
          {t.count ? <span className="tabular rounded-full bg-well px-1.5 text-[11px] font-semibold text-ink-2">{t.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

/* ── Sheet / side panel (US-FND-008) ──────────────────────────────── */

/** App layout: bottom sheet. Web layout: right side panel, or a centred dialog with `dialog`. */
export function Sheet({ open, onOpenChange, title, description, children, footer, dialog, wide }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; dialog?: boolean; wide?: boolean
}) {
  const layout = useLayout()
  const mode = layout === 'app' ? 'sheet' : dialog ? 'dialog' : 'panel'
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/35 motion-safe:animate-[fade-in_160ms_ease-out]" />
        <Dialog.Content
          aria-describedby={description ? undefined : undefined}
          className={cx(
            'fixed z-50 flex flex-col bg-surface outline-none',
            mode === 'sheet' && 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[20px] shadow-[var(--shadow-sheet)] motion-safe:animate-[sheet-up_280ms_var(--ease-out-expo)]',
            mode === 'panel' && cx('inset-y-0 right-0 w-full shadow-[var(--shadow-pop)] motion-safe:animate-[panel-in_280ms_var(--ease-out-expo)]', wide ? 'max-w-[640px]' : 'max-w-[480px]'),
            mode === 'dialog' && cx('top-1/2 left-1/2 max-h-[85dvh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 rounded-[16px] shadow-[var(--shadow-pop)] motion-safe:animate-[pop-in_200ms_var(--ease-out-expo)]', wide ? 'max-w-[640px]' : 'max-w-[440px]'),
          )}
        >
          {mode === 'sheet' && <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong" />}
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0">
              <Dialog.Title className="text-[17px] leading-snug font-semibold">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-[13px] text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === 'string' ? title : ''}</Dialog.Description>}
            </div>
            <Dialog.Close asChild><IconButton label="Đóng" className="-mt-2 -mr-2"><X size={20} aria-hidden /></IconButton></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && <div className="border-t border-line px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Confirmation dialog (US-FND-010). */
export function Confirm({ open, onOpenChange, title, body, confirmLabel, cancelLabel = 'Quay lại', onConfirm, danger, loading, children }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; body?: ReactNode; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; danger?: boolean; loading?: boolean; children?: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} dialog
      footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => onOpenChange(false)}>{cancelLabel}</Button><Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div>}>
      {body && <div className="text-[14px] text-ink-2">{body}</div>}
      {children}
    </Sheet>
  )
}

/* ── Toasts ───────────────────────────────────────────────────────── */

type ToastItem = { id: number; text: ReactNode; action?: { label: string; onClick: () => void }; tone?: 'ok' | 'error' }
let toasts: ToastItem[] = []
const toastListeners = new Set<() => void>()
let toastSeq = 0
export function toast(text: ReactNode, opts: { action?: ToastItem['action']; tone?: ToastItem['tone']; ms?: number } = {}) {
  const id = ++toastSeq
  toasts = [...toasts.slice(-2), { id, text, action: opts.action, tone: opts.tone }]
  toastListeners.forEach((l) => l())
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); toastListeners.forEach((l) => l()) }, opts.ms ?? (opts.action ? 5000 : 3200))
}
export function Toaster() {
  const list = useSyncExternalStore((l) => { toastListeners.add(l); return () => toastListeners.delete(l) }, () => toasts, () => toasts)
  const layout = useLayout()
  return (
    <div aria-live="polite" className={cx('pointer-events-none fixed z-[60] flex flex-col items-center gap-2', layout === 'app' ? 'inset-x-4 bottom-[88px]' : 'bottom-6 left-1/2 -translate-x-1/2')}>
      {list.map((t) => (
        <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex max-w-[480px] items-center gap-3 rounded-full bg-cta py-2.5 pr-2.5 pl-5 text-[14px] text-ground shadow-[var(--shadow-pop)] motion-safe:animate-[pop-in_220ms_var(--ease-out-expo)]">
          {t.tone === 'error' ? <AlertCircle size={16} aria-hidden className="shrink-0 text-[#f3b0a8]" /> : <Check size={16} aria-hidden className="shrink-0 text-[#9fd8c6]" />}
          <span className="min-w-0">{t.text}</span>
          {t.action ? <button type="button" onClick={() => { t.action!.onClick(); toasts = toasts.filter((x) => x.id !== t.id); toastListeners.forEach((l) => l()) }} className="h-8 shrink-0 rounded-full bg-ground/15 px-3 text-[13px] font-semibold hover:bg-ground/25">{t.action.label}</button> : <span className="w-2.5" />}
        </div>
      ))}
    </div>
  )
}

/* ── States (US-FND-009) ──────────────────────────────────────────── */

export function EmptyState({ icon, title, body, action, className }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('mx-auto flex max-w-[420px] flex-col items-center px-4 py-12 text-center', className)}>
      {icon && <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-well text-ink-2" aria-hidden>{icon}</div>}
      <h2 className="font-display text-[19px] font-semibold">{title}</h2>
      {body && <p className="mt-1.5 text-[14px] text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
export function ErrorState({ title = 'Không tải được nội dung', body = 'Kiểm tra kết nối rồi thử lại.', onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  return <EmptyState icon={<AlertCircle size={24} />} title={title} body={body} action={onRetry && <Button variant="secondary" onClick={onRetry}>Thử lại</Button>} />
}
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cx('skeleton block rounded-[8px]', className)} />
}
export function GridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="status" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="space-y-2"><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/3" /></div>
      ))}
    </div>
  )
}

/** Simulated fetch with latency, for skeleton states (US-FND-003). */
export function useLoaded(deps: unknown[] = [], ms?: number) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(false)
    let alive = true
    import('@/app/store').then(({ delay }) => (ms === 0 ? Promise.resolve() : delay())).then(() => alive && setReady(true))
    return () => { alive = false }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return ready
}

/** First catalogue image → its ~6KB thumbnail (DummyJSON only ships a thumbnail for image 1). */
export const thumbOf = (src?: string) => src?.replace(/\/1\.webp$/, '/thumbnail.webp')

/** Product image with a warm well behind it and graceful failure. Thumbnails by default; `full` for the gallery. */
export function Img({ src: raw, alt, className, eager, full }: { src?: string; alt: string; className?: string; eager?: boolean; full?: boolean }) {
  const src = full ? raw : thumbOf(raw)
  const [failed, setFailed] = useState(false)
  return (
    <span className={cx('relative block overflow-hidden bg-well', className)}>
      {src && !failed ? (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} className="absolute inset-0 size-full object-contain p-[6%] mix-blend-multiply" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[12px] text-muted">{alt ? 'Không tải được ảnh' : ''}</span>
      )}
    </span>
  )
}

export { vnd }

// US-DSC-003: search input with history, trending and suggestions (combobox).
// Web: dropdown under the header pill. App: the pill opens /search in its full-screen input state.
import { ArrowLeft, Clock, Search, Store, TrendingUp } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { pushSearch, removeSearch, useNow, useWorld } from '@/app/store'
import { cx } from '@/components/ui'
import { buildIndex, cleanQuery, serializeSearchParams, suggest, suggestionTerms, TRENDING, type Suggestion } from './search'

const PLACEHOLDER = 'Tìm sản phẩm, shop…'

export function SearchBox({ className }: { className?: string }) {
  const layout = useLayout()
  if (layout === 'app')
    return (
      <Link to="/search" className={cx('flex h-11 items-center gap-2.5 rounded-full bg-surface px-4 text-[15px] text-muted no-underline ring-1 ring-inset ring-line-strong', className)}>
        <Search size={18} aria-hidden className="text-ink" />{PLACEHOLDER}
      </Link>
    )
  return <SearchCombo mode="dropdown" className={className} />
}

type Row = { id: string; kind: 'history' | 'trending' | 'suggestion' | 'raw'; run: () => void; s?: Suggestion; text?: string }

/** Bold the matched part (weight only, never colour). */
function Mark({ text, at, len }: { text: string; at: number; len: number }) {
  if (at < 0 || !len) return <>{text}</>
  return <>{text.slice(0, at)}<b className="font-bold">{text.slice(at, at + len)}</b>{text.slice(at + len)}</>
}

/**
 * The input state. `dropdown`: popup list under the field (web header).
 * `page`: list always shown below (app full screen, web /search without q); `onCancel` adds back and "Hủy".
 */
export function SearchCombo({ mode, className, autoFocus, onCancel, onDone }: { mode: 'dropdown' | 'page'; className?: string; autoFocus?: boolean; onCancel?: () => void; onDone?: () => void }) {
  const w = useWorld()
  const t = useNow()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const urlQ = pathname === '/search' ? params.get('q') ?? '' : ''
  const [text, setText] = useState(urlQ)
  const [typed, setTyped] = useState(urlQ) // debounced 150 ms
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => { if (document.activeElement !== input.current) { setText(urlQ); setTyped(urlQ) } }, [urlQ])
  useEffect(() => { const h = setTimeout(() => setTyped(text), 150); return () => clearTimeout(h) }, [text])
  useEffect(() => setActive(-1), [typed, open])

  const rowsIndex = useMemo(() => buildIndex(w, t), [w, t])
  const terms = useMemo(() => suggestionTerms(w), [w])
  const q = typed.trim()
  const suggestions = useMemo(() => (q ? suggest(w, rowsIndex, terms, q) : []), [w, rowsIndex, terms, q])

  const close = () => { setOpen(false); onDone?.() }
  const go = (raw: string, cat?: string) => {
    const c = cleanQuery(raw)
    if (!c) return
    pushSearch(c)
    setText(c)
    close()
    input.current?.blur()
    nav(`/search?${serializeSearchParams({ q: c, cat })}`)
  }

  const rows: Row[] = []
  if (q) {
    suggestions.forEach((s, i) => rows.push({
      id: `${id}-s${i}`, kind: 'suggestion', s,
      run: () => (s.kind === 'shop' ? (close(), nav(`/s/${s.shop.handle}`)) : go(s.term, s.kind === 'scoped' ? s.cat.slug : undefined)),
    }))
    if (!suggestions.length) rows.push({ id: `${id}-raw`, kind: 'raw', text: q, run: () => go(text) })
  } else {
    w.searchHistory.forEach((h, i) => rows.push({ id: `${id}-h${i}`, kind: 'history', text: h, run: () => go(h) }))
    TRENDING.forEach((h, i) => rows.push({ id: `${id}-t${i}`, kind: 'trending', text: h, run: () => go(h) }))
  }
  const shown = mode === 'page' || open

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); setOpen(true)
      const n = rows.length; if (!n) return
      setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % n : (a <= 0 ? n - 1 : a - 1)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (shown && active >= 0 && rows[active]) rows[active].run(); else go(text)
    } else if (e.key === 'Escape') {
      if (mode === 'dropdown' && open) { e.preventDefault(); setOpen(false) } else onCancel?.()
    }
  }
  useEffect(() => { if (active >= 0) document.getElementById(rows[active]?.id)?.scrollIntoView({ block: 'nearest' }) }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const opt = (r: Row, i: number, children: ReactNode, cls: string) => (
    <div key={r.id} id={r.id} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={r.run} onMouseEnter={() => setActive(i)}
      className={cx('cursor-pointer', cls, i === active && 'bg-well')}>{children}</div>
  )
  const history = rows.filter((r) => r.kind === 'history')
  const trending = rows.filter((r) => r.kind === 'trending')
  const listId = `${id}-list`

  const list = (
    <div id={listId} role="listbox" aria-label="Gợi ý tìm kiếm"
      className={cx(mode === 'dropdown' ? 'absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[70dvh] overflow-y-auto rounded-[16px] bg-surface py-2 shadow-[var(--shadow-pop)]' : 'pt-3')}>
      {q ? rows.map((r, i) => {
        const s = r.s
        if (r.kind === 'raw') return opt(r, i, <><Search size={16} aria-hidden className="shrink-0 text-muted" /><span className="min-w-0 truncate">Tìm “{r.text}”</span></>, 'flex min-h-11 items-center gap-3 px-4 text-[14px]')
        if (s?.kind === 'shop') return opt(r, i, <><Store size={16} aria-hidden className="shrink-0 text-muted" /><span className="shrink-0">Shop</span><span className="min-w-0 truncate font-medium"><Mark text={s.shop.name} at={s.at} len={q.length} /></span></>, 'flex min-h-11 items-center gap-2 px-4 text-[14px]')
        if (s?.kind === 'scoped') return opt(r, i, <><span className="w-4 shrink-0" aria-hidden /><span className="min-w-0 truncate">{s.term} <span className="text-muted">trong</span> <span className="font-semibold">{s.cat.name}</span></span></>, 'flex min-h-11 items-center gap-3 px-4 text-[14px]')
        return opt(r, i, <><Search size={16} aria-hidden className="shrink-0 text-muted" /><span className="min-w-0 truncate"><Mark text={s!.kind === 'term' ? s!.term : ''} at={s!.kind === 'term' ? s!.at : -1} len={q.length} /></span></>, 'flex min-h-11 items-center gap-3 px-4 text-[14px]')
      }) : (
        <>
          {history.length > 0 && (
            <div role="group" aria-labelledby={`${id}-hh`} className="pb-2">
              <div className="flex items-center justify-between gap-3 px-4 py-1.5">
                <span id={`${id}-hh`} className="text-[13px] font-semibold text-ink-2">Lịch sử tìm kiếm</span>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => removeSearch()} className="min-h-9 text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">Xóa lịch sử tìm kiếm</button>
              </div>
              {history.map((r) => opt(r, rows.indexOf(r), <><Clock size={16} aria-hidden className="shrink-0 text-muted" /><span className="min-w-0 truncate">{r.text}</span></>, 'flex min-h-11 items-center gap-3 px-4 text-[14px]'))}
            </div>
          )}
          <div role="group" aria-labelledby={`${id}-th`} className="px-4 pb-2">
            <span id={`${id}-th`} className="flex items-center gap-1.5 py-1.5 text-[13px] font-semibold text-ink-2"><TrendingUp size={14} aria-hidden />Tìm kiếm phổ biến</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {trending.map((r) => opt(r, rows.indexOf(r), r.text, 'inline-flex min-h-9 items-center rounded-full bg-well px-3.5 text-[13px] hover:bg-line'))}
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div ref={box} className={cx('relative', className)}
      onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <form role="search" className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); go(text) }}>
        {onCancel && <button type="button" onClick={onCancel} aria-label="Quay lại" className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-well"><ArrowLeft size={22} aria-hidden /></button>}
        <div className="relative flex h-11 flex-1 items-center lg:h-12">
          <input
            ref={input}
            role="combobox"
            aria-label="Tìm sản phẩm, shop"
            aria-expanded={shown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? rows[active]?.id : undefined}
            enterKeyHint="search"
            autoFocus={autoFocus}
            autoComplete="off"
            maxLength={200}
            value={text}
            placeholder={PLACEHOLDER}
            onChange={(e) => { setText(e.target.value); setOpen(true) }}
            onFocus={(e) => { setOpen(true); e.target.select() }}
            onClick={() => setOpen(true)}
            onKeyDown={onKey}
            className="h-full w-full rounded-full bg-surface pr-14 pl-5 text-[15px] ring-2 ring-inset ring-ink outline-none focus:ring-jade"
          />
          <button type="submit" aria-label="Tìm kiếm" className="absolute right-1 flex size-9 items-center justify-center rounded-full bg-jade text-white hover:bg-jade-ink lg:size-10"><Search size={18} aria-hidden /></button>
        </div>
        {onCancel && <button type="button" onClick={onCancel} className="h-11 shrink-0 px-2 text-[15px] font-medium">Hủy</button>}
      </form>
      {shown && list}
    </div>
  )
}

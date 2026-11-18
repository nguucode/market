// US-DSC-004/005/006: results grid, chip row, filter panel, sort, paging, no results, shop match.
// Shared by /search and /c/:slug (scope = the route's category). The URL query is the only state.
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { delay, pushSearch, useNow, useWorld } from '@/app/store'
import { ProductGrid } from '@/components/ProductCard'
import { Button, ButtonLink, Checkbox, Chip, cx, EmptyState, GridSkeleton, inputClass, PageTitle, Radio, SectionHead, Sheet, useLoaded, RatingText } from '@/components/ui'
import { compactCount } from '@/domain/money'
import type { Category } from '@/domain/types'
import { Monogram, OfficialBadge } from '@/features/shp/bits'
import {
  activeFilterCount, buildIndex, clearFilters, facetCounts, groupDigits, hasFilters, matchShop, pageList, paginate, parseSearchParams, parseVndInput,
  PRICE_PRESETS, priceChipLabel, searchProducts, SEARCH_SORTS, serializeSearchParams, SORT_LABEL, topSelling, TRENDING, type Flag, type SearchParams, type Sort,
} from './search'

const PAGE = 40

/* ── Small shared pieces (also used by the shop page) ──────────────── */

export function SortControl({ value, options, onChange }: { value: Sort; options: Sort[]; onChange: (s: Sort) => void }) {
  const layout = useLayout()
  const [open, setOpen] = useState(false)
  if (layout === 'web') {
    const isPrice = value === 'price_asc' || value === 'price_desc'
    const seg = (on: boolean) => cx('inline-flex h-9 items-center gap-1 rounded-[var(--radius-control)] px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors',
      on ? 'bg-accent text-white' : 'bg-surface text-ink ring-1 ring-inset ring-line hover:text-accent-ink hover:ring-accent')
    const PriceIcon = value === 'price_asc' ? ArrowUp : value === 'price_desc' ? ArrowDown : ArrowUpDown
    return (
      <div role="group" aria-label="Sắp xếp" className="flex shrink-0 items-center gap-1.5">
        <span aria-hidden className="mr-1.5 text-[13px] text-muted">Sắp xếp</span>
        {options.filter((o) => o !== 'price_asc' && o !== 'price_desc').map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)} className={seg(value === o)}>{SORT_LABEL[o]}</button>
        ))}
        {options.includes('price_asc') && (
          <button type="button" aria-pressed={isPrice} onClick={() => onChange(value === 'price_asc' ? 'price_desc' : 'price_asc')}
            aria-label={isPrice ? SORT_LABEL[value] : 'Giá'} title={value === 'price_asc' ? SORT_LABEL.price_desc : SORT_LABEL.price_asc} className={seg(isPrice)}>
            Giá<PriceIcon size={14} aria-hidden />
          </button>
        )}
      </div>
    )
  }
  return (
    <>
      <Chip onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Sắp xếp: ${SORT_LABEL[value]}`}>{SORT_LABEL[value]}<ChevronDown size={14} aria-hidden /></Chip>
      <Sheet open={open} onOpenChange={setOpen} title="Sắp xếp">
        <div className="space-y-2" role="radiogroup" aria-label="Sắp xếp">
          {options.map((o) => <Radio key={o} name="sort" checked={value === o} onChange={() => { onChange(o); setOpen(false) }}>{SORT_LABEL[o]}</Radio>)}
        </div>
      </Sheet>
    </>
  )
}

export function Pager({ page, pages, onPage, compact }: { page: number; pages: number; onPage: (n: number) => void; compact?: boolean }) {
  if (pages <= 1) return null
  const cls = cx('flex items-center justify-center rounded-[var(--radius-control)] tabular', compact ? 'size-8 text-[13px]' : 'size-10 text-[14px]')
  const idle = 'bg-surface ring-1 ring-inset ring-line hover:text-accent-ink hover:ring-accent disabled:text-line-strong disabled:hover:ring-line'
  const step = (d: -1 | 1) => (
    <button type="button" className={cx(cls, idle)} disabled={d < 0 ? page <= 1 : page >= pages} onClick={() => onPage(page + d)} aria-label={d < 0 ? 'Trang trước' : 'Trang sau'}>
      {d < 0 ? <ChevronLeft size={compact ? 16 : 18} aria-hidden /> : <ChevronRight size={compact ? 16 : 18} aria-hidden />}
    </button>
  )
  if (compact)
    return (
      <nav aria-label="Phân trang nhanh" className="flex shrink-0 items-center gap-1">
        <span className="tabular mr-1.5 text-[13px]"><span className="font-semibold text-accent-ink">{page}</span><span className="text-muted">/{pages}</span></span>
        {step(-1)}{step(1)}
      </nav>
    )
  return (
    <nav aria-label="Phân trang" className="mt-8 flex items-center justify-center gap-1.5">
      {step(-1)}
      {pageList(page, pages).map((n, i) => n === '…'
        ? <span key={`g${i}`} className={cx(cls, 'text-muted')} aria-hidden>…</span>
        : <button key={n} type="button" onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined} aria-label={`Trang ${n}`} className={cx(cls, n === page ? 'bg-accent font-semibold text-white' : idle)}>{n}</button>)}
      {step(1)}
    </nav>
  )
}

/** App: load the next page near the end of the list; "Bạn đã xem hết kết quả" after the last. */
export function LoadMore({ hasMore, onMore }: { hasMore: boolean; onMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const more = useRef(onMore); more.current = onMore
  useEffect(() => {
    const el = ref.current
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || busy) return
      setBusy(true)
      delay().then(() => { more.current(); setBusy(false) })
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, busy])
  if (!hasMore) return <p className="py-8 text-center text-[13px] text-muted">Bạn đã xem hết kết quả</p>
  return <div ref={ref} className="pt-6">{busy ? <GridSkeleton n={4} /> : <span className="block h-10" />}</div>
}

/** Restore the scroll position for this exact URL on Back (sessionStorage, try/catch). */
export function useScrollMemory(ready: boolean) {
  const { pathname, search } = useLocation()
  const pop = useNavigationType() === 'POP'
  const key = `market.scroll:${pathname}${search}`
  useEffect(() => {
    if (!ready) return
    if (pop) try { const y = Number(sessionStorage.getItem(key)); if (y) requestAnimationFrame(() => window.scrollTo(0, y)) } catch { /* storage blocked */ }
    const save = () => { try { sessionStorage.setItem(key, String(Math.round(window.scrollY))) } catch { /* storage blocked */ } }
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [ready, key]) // eslint-disable-line react-hooks/exhaustive-deps
}

export const countText = (n: number) => `${groupDigits(n)} sản phẩm`

/* ── State hook: the only writer of the query ──────────────────────── */

export function useSearchState(scope?: Category) {
  const w = useWorld()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const valid = useMemo(() => ({ cats: new Set(w.categories.map((c) => c.slug)), provinces: new Set([...w.shops.map((s) => String(s.provinceCode)), 'foreign']) }), [w])
  const omit: (keyof SearchParams)[] = scope ? ['q', 'cat'] : []
  const url = parseSearchParams(sp, valid)
  const canonical = serializeSearchParams(url, omit).toString()
  useEffect(() => { if (canonical !== sp.toString()) setSp(canonical, { replace: true }) }, [canonical, sp, setSp])
  const params: SearchParams = scope ? { ...url, q: undefined, cat: scope.slug } : url
  /** Replace the whole state; a category facet outside the route's scope moves to that category page. */
  const set = (next: SearchParams, opts: { replace?: boolean } = {}) => {
    if (scope && next.cat && next.cat !== scope.slug) return nav(`/c/${next.cat}?${serializeSearchParams(next, omit)}`)
    setSp(serializeSearchParams(next, omit), opts)
  }
  /** Merge a change; any change but the page itself resets `page`. */
  const update = (patch: Partial<SearchParams>, opts: { replace?: boolean } = {}) => set({ ...params, page: undefined, ...patch }, opts)
  return { params, update, set, canonical }
}

/* ── Filter panel ─────────────────────────────────────────────────── */

const FLAG_LABEL: Record<Flag | 'rating', string> = { sale: 'Đang giảm', freeship: 'Freeship', voucher: 'Có voucher', official: 'Shop chính hãng', cod: 'Hỗ trợ COD', rating: 'Từ 4 sao' }

function FilterPanel({ open, onOpenChange, params, scope, onApply }: { open: boolean; onOpenChange: (o: boolean) => void; params: SearchParams; scope?: Category; onApply: (p: SearchParams) => void }) {
  const w = useWorld()
  const t = useNow()
  const rows = useMemo(() => buildIndex(w, t), [w, t])
  const [d, setD] = useState(params)
  const [err, setErr] = useState(false)
  const [allLoc, setAllLoc] = useState(false)
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const idBase = useId()
  useEffect(() => {
    if (!open) return
    setD(params); setErr(false); setAllLoc(false)
    setMin(groupDigits(params.price_min)); setMax(groupDigits(params.price_max))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const draft: SearchParams = { ...d, price_min: parseVndInput(min), price_max: parseVndInput(max) }
  const facets = useMemo(() => facetCounts(w, rows, draft, scope?.slug), [w, rows, JSON.stringify(draft), scope]) // eslint-disable-line react-hooks/exhaustive-deps
  const count = useMemo(() => searchProducts(w, rows, draft).length, [w, rows, JSON.stringify(draft)]) // eslint-disable-line react-hooks/exhaustive-deps
  const showCats = !scope || scope.level < 3
  const toggle = (k: Flag | 'rating') => setD((x) => ({ ...x, [k]: k === 'rating' ? (x.rating ? undefined : 4) : !x[k] }))
  const flagBox = (k: Flag | 'rating') => {
    const on = k === 'rating' ? !!d.rating : !!d[k]
    const n = facets.flags[k]
    return <Checkbox key={k} checked={on} disabled={!on && n === 0} onChange={() => toggle(k)} label={<>{FLAG_LABEL[k]} <span className="tabular text-muted">({groupDigits(n)})</span></>} />
  }
  const apply = () => {
    if (draft.price_min && draft.price_max && draft.price_min > draft.price_max) return setErr(true)
    onApply({ ...draft, page: undefined }); onOpenChange(false)
  }
  const reset = () => { setD({ q: d.q, sort: d.sort, cat: scope?.slug }); setMin(''); setMax(''); setErr(false) }
  const section = (title: string, children: ReactNode) => (
    <section className="border-b border-line py-4 last:border-0">
      <h3 className="mb-2 font-display text-[16px] font-semibold">{title}</h3>
      {children}
    </section>
  )
  const locs = allLoc ? facets.locations : facets.locations.slice(0, 6)
  const priceInput = (label: string, v: string, set: (s: string) => void) => (
    <div className="min-w-0 flex-1">
      <label htmlFor={`${idBase}${label}`} className="sr-only">{label}</label>
      <input id={`${idBase}${label}`} inputMode="numeric" placeholder={label} value={v} aria-invalid={err || undefined}
        onChange={(e) => { set(groupDigits(parseVndInput(e.target.value))); setErr(false) }} className={inputClass(err)} />
    </div>
  )
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Bộ lọc"
      footer={<div className="flex items-center justify-between gap-3"><Button variant="ghost" onClick={reset}>Thiết lập lại</Button><Button onClick={apply} className="min-w-40">Áp dụng ({groupDigits(count)})</Button></div>}>
      {section('Khoảng giá', <>
        <div className="flex items-center gap-2">{priceInput('Tối thiểu', min, setMin)}<span aria-hidden className="text-muted">–</span>{priceInput('Tối đa', max, setMax)}</div>
        {err && <p role="alert" className="mt-1.5 text-[12px] text-danger">Vui lòng điền khoảng giá phù hợp</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const on = parseVndInput(min) === p.min && parseVndInput(max) === p.max
            return <Chip key={p.label} selected={on} onClick={() => { setMin(on ? '' : groupDigits(p.min)); setMax(on ? '' : groupDigits(p.max)); setErr(false) }}>{p.label}</Chip>
          })}
        </div>
      </>)}
      {section('Ưu đãi', <div className="flex flex-col">{(['sale', 'freeship', 'voucher'] as const).map(flagBox)}</div>)}
      {showCats && facets.cats.length > 0 && section('Danh mục', (
        <div className="flex flex-col">
          {facets.cats.map(({ cat, n }) => {
            const on = d.cat === cat.slug
            return <Checkbox key={cat.id} checked={on} disabled={!on && n === 0} onChange={() => setD((x) => ({ ...x, cat: on ? scope?.slug : cat.slug }))} label={<>{cat.name} <span className="tabular text-muted">({groupDigits(n)})</span></>} />
          })}
        </div>
      ))}
      {facets.locations.length > 0 && section('Nơi bán', (
        <div className="flex flex-col">
          {locs.map((l) => {
            const on = !!d.location?.includes(l.code)
            return <Checkbox key={l.code} checked={on} disabled={!on && l.n === 0} label={<>{l.name} <span className="tabular text-muted">({groupDigits(l.n)})</span></>}
              onChange={() => setD((x) => { const s = new Set(x.location ?? []); if (on) s.delete(l.code); else s.add(l.code); return { ...x, location: s.size ? [...s] : undefined } })} />
          })}
          {facets.locations.length > 6 && <Button variant="link" className="mt-1 self-start" onClick={() => setAllLoc((v) => !v)}>{allLoc ? 'Thu gọn' : 'Xem thêm'}</Button>}
        </div>
      ))}
      {section('Đánh giá', flagBox('rating'))}
      {section('Loại shop', flagBox('official'))}
      {section('Dịch vụ', flagBox('cod'))}
    </Sheet>
  )
}

/* ── Chip row (app) and filter board (web) ──────────────────────────── */

type Props = { params: SearchParams; update: (p: Partial<SearchParams>) => void; set: (p: SearchParams) => void; scope?: Category; sortOptions: Sort[] }

/** Filters that are not visible as a quick chip: price, locations, category, voucher. */
function useRemovable(params: SearchParams, scope?: Category) {
  const w = useWorld()
  const cat = !scope && params.cat ? w.categories.find((c) => c.slug === params.cat) : undefined
  const provinceName = (c: string) => (c === 'foreign' ? 'Nước ngoài' : w.shops.find((s) => String(s.provinceCode) === c)?.provinceName ?? c)
  return [
    ...(params.price_min || params.price_max ? [{ key: 'price', label: priceChipLabel(params.price_min, params.price_max), clear: { price_min: undefined, price_max: undefined } }] : []),
    ...(params.location ?? []).map((c) => ({ key: `l${c}`, label: provinceName(c), clear: { location: params.location!.filter((x) => x !== c) } })),
    ...(cat ? [{ key: 'cat', label: cat.name, clear: { cat: undefined } }] : []),
    ...(params.voucher ? [{ key: 'voucher', label: 'Có voucher', clear: { voucher: undefined } }] : []),
  ] as { key: string; label: string; clear: Partial<SearchParams> }[]
}

const QUICK: (Flag | 'rating')[] = ['sale', 'freeship', 'official', 'rating', 'cod']
const flagOn = (params: SearchParams, k: Flag | 'rating') => (k === 'rating' ? !!params.rating : !!params[k])
const flagPatch = (params: SearchParams, k: Flag | 'rating') => ({ [k]: k === 'rating' ? (params.rating ? undefined : 4) : !params[k] || undefined })

function ClearAll({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-9 shrink-0 px-2 text-[13px] font-semibold whitespace-nowrap text-accent-ink underline-offset-4 hover:underline">Xóa tất cả</button>
}

function ChipRow({ params, update, set, scope, sortOptions }: Props) {
  const [open, setOpen] = useState(false)
  const n = activeFilterCount(params, !!scope)
  const removable = useRemovable(params, scope)
  return (
    <div className="sticky top-14 z-30 -mx-3 flex items-center gap-2 bg-surface py-2 pl-3 shadow-[0_1px_0_var(--color-line)]">
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]">
        <SortControl value={params.sort ?? 'relevance'} options={sortOptions} onChange={(s) => update({ sort: s })} />
        <Chip selected={n > 0} onClick={() => setOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={14} aria-hidden />Bộ lọc{n > 0 && ` (${n})`}</Chip>
        {QUICK.map((k) => <Chip key={k} selected={flagOn(params, k)} onClick={() => update(flagPatch(params, k))}>{FLAG_LABEL[k]}</Chip>)}
        {removable.map((r) => (
          <Chip key={r.key} selected onClick={() => update(r.clear)} aria-label={`Bỏ lọc ${r.label}`}>{r.label}<X size={14} aria-hidden /></Chip>
        ))}
        {n > 0 && <ClearAll onClick={() => set({ ...clearFilters(params), cat: scope?.slug })} />}
      </div>
      <FilterPanel open={open} onOpenChange={setOpen} params={params} scope={scope} onApply={set} />
    </div>
  )
}

/** Web: the filter board, one row per facet (label left, chips right), then the sort bar. */
function FilterBoard({ params, update, set, scope }: Omit<Props, 'sortOptions'>) {
  const w = useWorld()
  const t = useNow()
  const rows = useMemo(() => buildIndex(w, t), [w, t])
  const facets = useMemo(() => facetCounts(w, rows, params, scope?.slug), [w, rows, JSON.stringify(params), scope]) // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(false)
  const n = activeFilterCount(params, !!scope)
  const removable = useRemovable(params, scope)
  const idBase = useId()
  const row = (key: string, label: string, children: ReactNode) => (
    <div role="group" aria-labelledby={`${idBase}${key}`} className="flex gap-4 border-b border-line py-2.5 last:border-0">
      <span id={`${idBase}${key}`} className="w-[84px] shrink-0 pt-2 text-[13px] text-muted">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
    </div>
  )
  const cats = !scope || scope.level < 3 ? facets.cats.slice(0, 14) : []
  return (
    <div className="panel px-5 py-1.5">
      {cats.length > 0 && row('cat', 'Danh mục', cats.map(({ cat, n }) => {
        const on = params.cat === cat.slug
        return <Chip key={cat.id} selected={on} disabled={!on && n === 0} onClick={() => update({ cat: on ? scope?.slug : cat.slug })}>{cat.name}</Chip>
      }))}
      {row('price', 'Khoảng giá', PRICE_PRESETS.map((p) => {
        const on = params.price_min === p.min && params.price_max === p.max
        return <Chip key={p.label} selected={on} onClick={() => update({ price_min: on ? undefined : p.min, price_max: on ? undefined : p.max })}>{p.label}</Chip>
      }))}
      {facets.locations.length > 0 && row('loc', 'Nơi bán', facets.locations.slice(0, 10).map((l) => {
        const on = !!params.location?.includes(l.code)
        return <Chip key={l.code} selected={on} disabled={!on && l.n === 0}
          onClick={() => { const s = new Set(params.location ?? []); if (on) s.delete(l.code); else s.add(l.code); update({ location: s.size ? [...s] : undefined }) }}>{l.name}</Chip>
      }))}
      {row('flags', 'Ưu đãi', <>
        {(['sale', 'freeship', 'voucher', 'official', 'rating', 'cod'] as const).map((k) => <Chip key={k} selected={flagOn(params, k)} onClick={() => update(flagPatch(params, k))}>{FLAG_LABEL[k]}</Chip>)}
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog" className="ml-auto text-accent-ink"><SlidersHorizontal size={14} aria-hidden />Bộ lọc{n > 0 && ` (${n})`}</Button>
      </>)}
      {n > 0 && row('picked', 'Đã chọn', <>
        {removable.map((r) => <Chip key={r.key} selected onClick={() => update(r.clear)} aria-label={`Bỏ lọc ${r.label}`}>{r.label}<X size={14} aria-hidden /></Chip>)}
        <ClearAll onClick={() => set({ ...clearFilters(params), cat: scope?.slug })} />
      </>)}
      <FilterPanel open={open} onOpenChange={setOpen} params={params} scope={scope} onApply={set} />
    </div>
  )
}

/* ── No results and shop match ────────────────────────────────────── */

function ShopMatch({ shop }: { shop: ReturnType<typeof matchShop> & object }) {
  const w = useWorld()
  const n = w.products.filter((p) => p.shopId === shop.id && p.status === 'active').length
  return (
    <section aria-label="Shop phù hợp" className="panel mb-3 flex items-center gap-3 p-3 lg:gap-5 lg:p-5">
      <Monogram shop={shop} className="size-12 text-[17px] lg:size-16 lg:text-[22px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[17px] font-semibold lg:text-[20px]" title={shop.name}>{shop.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted lg:text-[14px]">
          {shop.isOfficial && <OfficialBadge />}
          <RatingText value={shop.rating} /><span aria-hidden>·</span>
          <span>{compactCount(shop.followers)} người theo dõi</span><span aria-hidden>·</span>
          <span>{groupDigits(n)} sản phẩm</span>
        </p>
      </div>
      <ButtonLink to={`/s/${shop.handle}`} variant="secondary" size="sm" className="shrink-0">Xem shop</ButtonLink>
    </section>
  )
}

/** "Gợi ý hôm nay": top products by soldCount (US-DSC-006 fallback). */
export function TodayPicks() {
  const w = useWorld()
  const items = useMemo(() => topSelling(w.products, new Set(w.categories.map((c) => c.id)), 20), [w])
  return (
    <section aria-labelledby="today-picks" className="mt-8">
      <SectionHead id="today-picks" title="Gợi ý hôm nay" />
      <ProductGrid products={items} />
    </section>
  )
}

function NoResults({ q, filtered, onClear }: { q?: string; filtered: boolean; onClear: () => void }) {
  const nav = useNavigate()
  if (filtered)
    return <div className="panel"><EmptyState icon={<SearchX size={24} />} title="Không có sản phẩm phù hợp với bộ lọc" action={<Button onClick={onClear}>Xóa bộ lọc</Button>} /></div>
  return (
    <div>
      <div className="panel px-4 py-10 text-center">
        <h2 className="mx-auto line-clamp-2 max-w-[560px] font-display text-[18px] break-words lg:text-[20px]">Không tìm thấy kết quả nào cho “{q}”</h2>
        <p className="mt-2 text-[14px] text-muted">Hãy thử từ khóa khác hoặc từ khóa chung hơn</p>
        <p className="mt-6 mb-2 text-[13px] font-semibold text-ink-2">Tìm kiếm phổ biến</p>
        <div className="mx-auto flex max-w-[560px] flex-wrap justify-center gap-2">
          {TRENDING.map((x) => <Chip key={x} onClick={() => { pushSearch(x); nav(`/search?${serializeSearchParams({ q: x })}`) }}>{x}</Chip>)}
        </div>
      </div>
      <TodayPicks />
    </div>
  )
}

/* ── Results ──────────────────────────────────────────────────────── */

export function Results({ scope, title, before }: { scope?: Category; title?: (count: ReactNode) => ReactNode; before?: ReactNode }) {
  const w = useWorld()
  const t = useNow()
  const layout = useLayout()
  const { params, update, set, canonical } = useSearchState(scope)
  const rows = useMemo(() => buildIndex(w, t), [w, t])
  const all = useMemo(() => searchProducts(w, rows, params), [w, rows, JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps
  const { items, page, pages } = paginate(all, params.page, PAGE)
  const shown = layout === 'app' ? all.slice(0, page * PAGE) : items
  const filtered = hasFilters(params, !!scope)
  const shop = !scope && params.q && !filtered ? matchShop(w.shops, params.q) : null
  const loadKey = layout === 'app' ? serializeSearchParams({ ...params, page: undefined }).toString() : canonical
  const ready = useLoaded([loadKey, scope?.id])
  const top = useRef<HTMLDivElement>(null)
  useScrollMemory(ready)
  useEffect(() => { if (params.page && params.page > pages) update({ page: pages }, { replace: true }) }, [params.page, pages]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = <span className="tabular text-[14px] font-normal text-muted">{ready ? countText(all.length) : ''}</span>
  const sortOptions = SEARCH_SORTS
  const props = { params, update, set, scope }
  const toPage = (n: number) => { update({ page: n }); top.current?.scrollIntoView({ behavior: 'smooth' }) }
  return (
    <div>
      {title ? title(count) : null}
      {before}
      <div ref={top} className="scroll-mt-32">
        {layout === 'web' ? (
          <>
            <FilterBoard {...props} />
            <div className="panel mt-3 flex items-center gap-4 px-5 py-2.5">
              <SortControl value={params.sort ?? 'relevance'} options={sortOptions} onChange={(s) => update({ sort: s })} />
              <span className="flex-1" />
              <span className="tabular text-[13px] text-muted" aria-live="polite">{ready ? countText(all.length) : ' '}</span>
              {ready && <Pager compact page={page} pages={pages} onPage={toPage} />}
            </div>
          </>
        ) : (
          <>
            <ChipRow {...props} sortOptions={sortOptions} />
            {!title && <p className="mt-3 text-[13px] text-muted" aria-live="polite">{ready ? countText(all.length) : ' '}</p>}
          </>
        )}
      </div>
      <div className="mt-3">
        {!ready ? <GridSkeleton n={20} /> : (
          <>
            {shop && <ShopMatch shop={shop} />}
            {all.length === 0 ? (
              <NoResults q={params.q} filtered={filtered} onClear={() => set({ ...clearFilters(params), cat: scope?.slug })} />
            ) : (
              <>
                <ProductGrid products={shown.map((r) => r.p)} eagerFirst={4} />
                {layout === 'web'
                  ? <Pager page={page} pages={pages} onPage={toPage} />
                  : <LoadMore hasMore={page < pages} onMore={() => update({ page: page + 1 }, { replace: true })} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** Search heading: "Kết quả tìm kiếm cho “q”" and the count on the same line (app; web shows the count in the sort bar). */
export function SearchHeading({ q, count }: { q?: string; count?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <PageTitle className="line-clamp-2 min-w-0 break-words">{q ? <>Kết quả tìm kiếm cho “{q}”</> : 'Tất cả sản phẩm'}</PageTitle>
      {count}
    </div>
  )
}

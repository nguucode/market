// US-DSC-004/005/006: results grid, chip row, filter panel, sort, paging, no results, shop match.
// Shared by /search and /c/:slug (scope = the route's category). The URL query is the only state.
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { delay, pushSearch, useNow, useWorld } from '@/app/store'
import { ProductGrid } from '@/components/ProductCard'
import { Button, ButtonLink, Checkbox, Chip, cx, EmptyState, GridSkeleton, inputClass, PageTitle, Radio, Sheet, useLoaded, RatingText } from '@/components/ui'
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
  if (layout === 'web')
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[14px] hover:bg-well">
          <span className="text-muted">Sắp xếp:</span><span className="font-semibold">{SORT_LABEL[value]}</span><ChevronDown size={15} aria-hidden />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="z-50 w-56 rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-pop)]">
            <DropdownMenu.RadioGroup value={value} onValueChange={(v) => onChange(v as Sort)}>
              {options.map((o) => (
                <DropdownMenu.RadioItem key={o} value={o} className="flex h-10 cursor-pointer items-center justify-between rounded-[10px] px-3 text-[14px] outline-none data-[highlighted]:bg-well data-[state=checked]:font-semibold">
                  {SORT_LABEL[o]}<DropdownMenu.ItemIndicator><Check size={15} aria-hidden /></DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
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

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
  if (pages <= 1) return null
  const cls = 'flex size-10 items-center justify-center rounded-full text-[14px] tabular'
  return (
    <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-1">
      <button type="button" className={cx(cls, 'hover:bg-well disabled:text-line-strong')} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Trang trước"><ChevronLeft size={18} aria-hidden /></button>
      {pageList(page, pages).map((n, i) => n === '…'
        ? <span key={`g${i}`} className={cls} aria-hidden>…</span>
        : <button key={n} type="button" onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined} aria-label={`Trang ${n}`} className={cx(cls, n === page ? 'bg-ink font-semibold text-ground' : 'hover:bg-well')}>{n}</button>)}
      <button type="button" className={cx(cls, 'hover:bg-well disabled:text-line-strong')} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Trang sau"><ChevronRight size={18} aria-hidden /></button>
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

/* ── Chip row ─────────────────────────────────────────────────────── */

function ChipRow({ params, update, set, scope, sortOptions }: { params: SearchParams; update: (p: Partial<SearchParams>) => void; set: (p: SearchParams) => void; scope?: Category; sortOptions: Sort[] }) {
  const w = useWorld()
  const layout = useLayout()
  const [open, setOpen] = useState(false)
  const ignoreCat = !!scope
  const n = activeFilterCount(params, ignoreCat)
  const sort = <SortControl value={params.sort ?? 'relevance'} options={sortOptions} onChange={(s) => update({ sort: s })} />
  const cat = !scope && params.cat ? w.categories.find((c) => c.slug === params.cat) : undefined
  const provinceName = (c: string) => (c === 'foreign' ? 'Nước ngoài' : w.shops.find((s) => String(s.provinceCode) === c)?.provinceName ?? c)
  const removable: { key: string; label: string; clear: Partial<SearchParams> }[] = [
    ...(params.price_min || params.price_max ? [{ key: 'price', label: priceChipLabel(params.price_min, params.price_max), clear: { price_min: undefined, price_max: undefined } }] : []),
    ...(params.location ?? []).map((c) => ({ key: `l${c}`, label: provinceName(c), clear: { location: params.location!.filter((x) => x !== c) } })),
    ...(cat ? [{ key: 'cat', label: cat.name, clear: { cat: undefined } }] : []),
    ...(params.voucher ? [{ key: 'voucher', label: 'Có voucher', clear: { voucher: undefined } }] : []),
  ]
  const quick: (Flag | 'rating')[] = ['sale', 'freeship', 'official', 'rating', 'cod']
  return (
    <div className={cx('flex items-center gap-2', layout === 'app' && 'sticky top-14 z-30 -mx-4 bg-ground/95 py-2 pl-4 backdrop-blur-[6px]')}>
      <div className={cx('no-scrollbar flex min-w-0 flex-1 items-center gap-2', layout === 'app' ? 'overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]' : 'flex-wrap')}>
        {layout === 'app' && sort}
        <Chip selected={n > 0} onClick={() => setOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={14} aria-hidden />Bộ lọc{n > 0 && ` (${n})`}</Chip>
        {quick.map((k) => {
          const on = k === 'rating' ? !!params.rating : !!params[k]
          return <Chip key={k} selected={on} onClick={() => update({ [k]: k === 'rating' ? (on ? undefined : 4) : !on || undefined })}>{FLAG_LABEL[k]}</Chip>
        })}
        {removable.map((r) => (
          <Chip key={r.key} selected onClick={() => update(r.clear)} aria-label={`Bỏ lọc ${r.label}`}>{r.label}<X size={14} aria-hidden /></Chip>
        ))}
        {n > 0 && <button type="button" onClick={() => set({ ...clearFilters(params), cat: scope?.slug })} className="min-h-9 shrink-0 px-2 text-[13px] font-semibold whitespace-nowrap underline underline-offset-4">Xóa tất cả</button>}
      </div>
      {layout === 'web' && sort}
      <FilterPanel open={open} onOpenChange={setOpen} params={params} scope={scope} onApply={set} />
    </div>
  )
}

/* ── No results and shop match ────────────────────────────────────── */

function ShopMatch({ shop }: { shop: ReturnType<typeof matchShop> & object }) {
  const w = useWorld()
  const n = w.products.filter((p) => p.shopId === shop.id && p.status === 'active').length
  return (
    <section aria-label="Shop phù hợp" className="mb-6 flex items-center gap-3 border-b border-line pb-5 lg:gap-5">
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
      <h2 id="today-picks" className="mb-4 font-display text-[20px] font-semibold lg:text-[24px]">Gợi ý hôm nay</h2>
      <ProductGrid products={items} />
    </section>
  )
}

function NoResults({ q, filtered, onClear }: { q?: string; filtered: boolean; onClear: () => void }) {
  const nav = useNavigate()
  if (filtered)
    return <EmptyState icon={<SearchX size={24} />} title="Không có sản phẩm phù hợp với bộ lọc" action={<Button onClick={onClear}>Xóa bộ lọc</Button>} />
  return (
    <div>
      <div className="mx-auto max-w-[560px] py-10 text-center">
        <h2 className="line-clamp-2 font-display text-[20px] font-semibold break-words lg:text-[24px]">Không tìm thấy kết quả nào cho “{q}”</h2>
        <p className="mt-2 text-[14px] text-muted">Hãy thử từ khóa khác hoặc từ khóa chung hơn</p>
        <p className="mt-6 mb-2 text-[13px] font-semibold text-ink-2">Tìm kiếm phổ biến</p>
        <div className="flex flex-wrap justify-center gap-2">
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
  return (
    <div>
      {title ? title(count) : null}
      {before}
      <div ref={top} className="scroll-mt-32">
        <ChipRow params={params} update={update} set={set} scope={scope} sortOptions={sortOptions} />
        {!title && <p className="mt-3 text-[13px] text-muted" aria-live="polite">{ready ? countText(all.length) : ' '}</p>}
      </div>
      <div className="mt-4">
        {!ready ? <GridSkeleton n={20} /> : (
          <>
            {shop && <ShopMatch shop={shop} />}
            {all.length === 0 ? (
              <NoResults q={params.q} filtered={filtered} onClear={() => set({ ...clearFilters(params), cat: scope?.slug })} />
            ) : (
              <>
                <ProductGrid products={shown.map((r) => r.p)} eagerFirst={4} />
                {layout === 'web'
                  ? <Pager page={page} pages={pages} onPage={(n) => { update({ page: n }); top.current?.scrollIntoView({ behavior: 'smooth' }) }} />
                  : <LoadMore hasMore={page < pages} onMore={() => update({ page: page + 1 }, { replace: true })} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** Search heading: "Kết quả tìm kiếm cho “q”" and the count on the same line. */
export function SearchHeading({ q, count }: { q?: string; count: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <PageTitle className="line-clamp-2 min-w-0 text-[20px]! break-words lg:text-[24px]!">{q ? <>Kết quả tìm kiếm cho “{q}”</> : 'Tất cả sản phẩm'}</PageTitle>
      {count}
    </div>
  )
}

// US-HOM-001…005: three-column hero (categories, deal banner, buyer card), deal modules, themed rails, "Gợi ý hôm nay".
import { ChevronRight, LayoutGrid, Ticket, Zap } from 'lucide-react'
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigationType } from 'react-router'
import { childrenOf, leavesUnder, priceView } from '@/app/catalog'
import { useLayout } from '@/app/layout'
import { delay, useNow, useWorld } from '@/app/store'
import { ProductCard, ProductGrid } from '@/components/ProductCard'
import { Button, ButtonLink, Chip, cx, GridSkeleton, Img, PageTitle, SectionHead, Skeleton, useLoaded } from '@/components/ui'
import { voucherLabel } from '@/domain/pricing'
import { orderTabCounts } from '@/features/acc/account'
import { reviewPrompt } from '@/features/ord/logic'
import { hubList, pickHomeVouchers } from '@/features/prm/vouchers'
import { VoucherTile } from '@/features/prm/VoucherTile'
import { flashSlotState, formatCountdown, startLabel } from './flash'
import { FlashCard, flashEntries, PriceChip } from './FlashCard'
import { autoLoadAllowed, categoryTiles, HERO, kitchenMosaic, RAILS, railProducts, REC_PAGE, recommendationPage } from './home'
import { Rail } from './Rail'

/* ── Per-tab memory: scroll position, feed tab and recommendation pages survive PDP → back (US-HOM-001) ── */

const KEY = 'market.home.v1'
type Memo = { y: number; pages: number; tab: string }
const readMemo = (): Memo => { try { return { y: 0, pages: 1, tab: 'all', ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') } } catch { return { y: 0, pages: 1, tab: 'all' } } }
const writeMemo = (patch: Partial<Memo>) => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...readMemo(), ...patch })) } catch { /* private mode */ } }

function useScrollMemory(back: boolean) {
  useEffect(() => {
    if (!back) writeMemo({ y: 0, pages: 1, tab: 'all' })
    const y = readMemo().y
    // The shell scrolls to top on route change after this effect; restore once sections have rendered.
    const restore = back && y ? window.setTimeout(() => window.scrollTo(0, y), 80) : 0
    let raf = 0
    const save = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => writeMemo({ y: window.scrollY })) }
    const arm = window.setTimeout(() => window.addEventListener('scroll', save, { passive: true }), 120)
    return () => { clearTimeout(restore); clearTimeout(arm); cancelAnimationFrame(raf); window.removeEventListener('scroll', save) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ── Section frame: each section fails on its own (US-FND-009) ── */

class SectionBoundary extends Component<{ children: ReactNode; className?: string }, { failed: boolean; key: number }> {
  state = { failed: false, key: 0 }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <div className={cx('panel flex items-center justify-between gap-3 px-4 py-4 text-[14px]', this.props.className)}>
        <span className="text-ink-2">Không tải được mục này.</span>
        <Button variant="secondary" size="sm" onClick={() => this.setState((s) => ({ failed: false, key: s.key + 1 }))}>Thử lại</Button>
      </div>
    )
    return <div key={this.state.key} className={this.props.className}>{this.props.children}</div>
  }
}

/** Section-head link: accent-ink text, right-aligned. */
function ViewAll({ to, label = 'Xem tất cả' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-accent-ink no-underline hover:underline">
      {label}<ChevronRight size={15} aria-hidden />
    </Link>
  )
}

/** Shared flash-slot read for the banner entry, the flash module and the feed exclusion. */
function useFlashBand() {
  const w = useWorld()
  const t = useNow()
  const st = flashSlotState(w.flashSlots, t)
  const slot = st.active ?? st.next
  const status = !slot ? undefined : st.active ? `Kết thúc sau ${formatCountdown(st.endsInMs!)}` : startLabel(slot.startsAt, t)
  return { w, st, slot, status }
}

/* ── Categories: list panel on the web, icon grid on the app (US-HOM-002) ── */

function CategoryList({ instant }: { instant: boolean }) {
  const w = useWorld()
  const ready = useLoaded([], instant ? 0 : undefined)
  const tiles = categoryTiles(w)
  if (ready && !tiles.length) return null
  return (
    <nav aria-labelledby="home-cats" className="panel h-full py-2">
      <h2 id="home-cats" className="sr-only">Mua sắm theo danh mục</h2>
      <ul role="list">
        {ready ? tiles.map(({ category: c, image }) => (
          <li key={c.id}>
            <Link to={`/c/${c.slug}`} className="mx-2 flex h-10 items-center gap-2.5 rounded-[var(--radius-control)] px-2 text-[14px] text-ink no-underline hover:bg-accent-soft hover:text-accent-ink">
              <Img src={image} alt="" className="size-7 shrink-0 rounded-[6px]" />
              <span className="min-w-0 flex-1 truncate" title={c.name}>{c.name}</span>
            </Link>
          </li>
        )) : Array.from({ length: 9 }, (_, i) => (
          <li key={i} aria-hidden className="mx-2 flex h-10 items-center gap-2.5 px-2"><Skeleton className="size-7" /><Skeleton className="h-3.5 w-28" /></li>
        ))}
      </ul>
    </nav>
  )
}

function CategoryGrid({ instant }: { instant: boolean }) {
  const w = useWorld()
  const ready = useLoaded([], instant ? 0 : undefined)
  const tiles = categoryTiles(w)
  if (ready && !tiles.length) return null
  const tile = 'flex flex-col items-center gap-1.5 text-center no-underline'
  const circle = 'size-12 rounded-full'
  const label = 'line-clamp-2 min-h-[2lh] text-[11px] leading-[14px] text-ink'
  return (
    <section aria-labelledby="home-cats" className="panel px-1 py-3">
      <h2 id="home-cats" className="sr-only">Mua sắm theo danh mục</h2>
      <ul role="list" className="grid grid-cols-5 gap-y-3">
        {ready ? (<>
          {tiles.map(({ category: c, image }) => (
            <li key={c.id}>
              <Link to={`/c/${c.slug}`} className={tile}>
                <Img src={image} alt="" className={circle} />
                <span className={label}>{c.name}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/categories" className={tile}>
              <span className={cx(circle, 'flex items-center justify-center bg-accent-soft text-accent-ink')}><LayoutGrid size={20} strokeWidth={1.7} aria-hidden /></span>
              <span className={label}>Tất cả danh mục</span>
            </Link>
          </li>
        </>) : Array.from({ length: 10 }, (_, i) => (
          <li key={i} className={tile} aria-hidden><Skeleton className={cx(circle, 'rounded-full!')} /><Skeleton className="h-3 w-12" /></li>
        ))}
      </ul>
    </section>
  )
}

/* ── Deal banner: the campaign, with flash sale and voucher entries (US-HOM-001) ── */

function Banner() {
  const { w, slot, status } = useFlashBand()
  const t = useNow()
  const web = useLayout() === 'web'
  const mosaic = kitchenMosaic(w)
  const target = w.categories.some((c) => c.slug === HERO.cta.category) ? `/c/${HERO.cta.category}` : '/categories'
  const best = pickHomeVouchers(w.vouchers, w.savedVouchers, t)[0]
  const entry = 'flex min-w-0 items-center gap-3 rounded-[var(--radius-control)] bg-well px-3 py-2.5 no-underline hover:bg-accent-soft'
  return (
    <section aria-labelledby="home-hero" className="panel flex h-full flex-col gap-4 p-4 lg:p-5">
      <div className="grid flex-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-6">
        <div className="lg:pl-2">
          <PageTitle className="text-[22px]! leading-[1.2]! text-balance lg:text-[32px]! lg:leading-[1.15]!"><span id="home-hero">{HERO.headline}</span></PageTitle>
          <p className="mt-2 max-w-[40ch] text-[14px] text-ink-2 lg:mt-3 lg:text-[15px]">{HERO.subhead}</p>
          <ButtonLink to={target} size={web ? 'lg' : 'md'} className="mt-4 max-lg:w-full lg:mt-6">{HERO.cta.label}</ButtonLink>
        </div>
        <ul role="list" aria-label="Sản phẩm trong bộ sưu tập" className="grid grid-cols-3 gap-2 max-lg:order-first">
          {mosaic.map((p, i) => (
            <li key={p.id} className={cx(i >= 3 && 'hidden lg:block')}>
              <Link to={`/p/${p.slug}`} className="block rounded-[var(--radius-control)]">
                <Img src={p.images[0]} alt={p.name} eager className="aspect-square w-full rounded-[var(--radius-control)] transition-[filter] hover:brightness-[0.97]" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {web && (
        <div className="grid grid-cols-2 gap-3">
          {slot && (
            <Link to="/flash-sale" className={entry}>
              <Zap size={20} aria-hidden className="shrink-0 fill-accent text-accent" />
              <span className="min-w-0"><span className="block text-[14px] font-semibold text-ink">Flash sale</span><span className="block truncate text-[12px] text-accent-ink">{status}</span></span>
            </Link>
          )}
          <Link to="/vouchers" className={entry}>
            <Ticket size={20} aria-hidden className="shrink-0 text-accent" />
            <span className="min-w-0"><span className="block text-[14px] font-semibold text-ink">Kho voucher</span>{best && <span className="block truncate text-[12px] text-accent-ink">{voucherLabel(best.voucher)}</span>}</span>
          </Link>
        </div>
      )}
    </section>
  )
}

/* ── Buyer card (web) ── */

function BuyerCard() {
  const w = useWorld()
  const t = useNow()
  const counts = orderTabCounts(w.orders)
  const toReview = w.orders.filter((o) => ['open', 'partial'].includes(reviewPrompt(o, t).kind)).length
  const saved = hubList(w.vouchers, w.savedVouchers, 'all', t).filter((x) => x.state === 'saved').length
  const shortcuts: [string, number, string][] = [
    ['Chờ thanh toán', counts.awaiting_payment, 'awaiting_payment'],
    ['Chờ lấy hàng', counts.to_ship, 'to_ship'],
    ['Đang giao', counts.shipping, 'shipping'],
    ['Đánh giá', toReview, 'delivered'],
  ]
  return (
    <aside aria-labelledby="home-buyer" className="panel flex h-full flex-col p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-[16px] font-bold text-white">{w.buyer.avatarInitials}</span>
        <div className="min-w-0">
          <h2 id="home-buyer" className="truncate text-[15px] font-bold">Xin chào, {w.buyer.name}</h2>
          <Link to="/me" className="text-[12px] text-muted no-underline hover:text-accent-ink">Tài khoản của tôi</Link>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold">Đơn mua</h3>
        <ViewAll to="/orders" />
      </div>
      <ul role="list" className="mt-2 grid grid-cols-2 gap-2">
        {shortcuts.map(([label, n, status]) => (
          <li key={label}>
            <Link to={`/orders?status=${status}`} className="flex flex-col rounded-[var(--radius-control)] bg-well px-3 py-2 no-underline hover:bg-accent-soft">
              <span aria-hidden className={cx('tabular text-[18px] leading-6 font-bold', n ? 'text-accent' : 'text-ink-2')}>{n}</span>
              <span className="text-[12px] whitespace-nowrap text-ink-2">{label}<span className="sr-only">, {n} đơn</span></span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/vouchers" className="mt-auto flex items-center gap-2.5 rounded-[var(--radius-control)] px-1 pt-4 text-[14px] text-ink no-underline hover:text-accent-ink">
        <Ticket size={18} aria-hidden className="text-accent" />
        <span className="flex-1">Voucher đã lưu</span>
        <span className="tabular font-bold text-accent">{saved}</span>
        <ChevronRight size={15} aria-hidden className="text-muted" />
      </Link>
    </aside>
  )
}

/* ── Modules: flash sale, vouchers, official shops ── */

function FlashModule({ instant }: { instant: boolean }) {
  const { w, st, slot, status } = useFlashBand()
  const web = useLayout() === 'web'
  const ready = useLoaded([], instant ? 0 : undefined)
  const entries = slot ? flashEntries(w, slot, 10) : []
  if (!slot || (ready && !entries.length)) return null
  const card = (e: (typeof entries)[number]) => <FlashCard entry={e} w={w} upcoming={!st.active} />
  return (
    <section aria-labelledby="home-flash" className="panel h-full overflow-hidden p-3 lg:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Zap size={18} aria-hidden className="shrink-0 fill-accent text-accent" />
          <h2 id="home-flash" className="shrink-0 font-display text-[18px] leading-tight whitespace-nowrap">Flash sale</h2>
          <p className="truncate text-[12px] font-medium text-accent-ink lg:text-[13px]"><span className="sr-only">{st.active ? 'Đang diễn ra · ' : 'Sắp diễn ra · '}</span>{status}</p>
        </div>
        <ViewAll to="/flash-sale" />
      </div>
      {!ready ? <ModuleSkeleton n={web ? 4 : 3} />
        : web ? <ul role="list" aria-label="Sản phẩm Flash sale" className="grid grid-cols-4 gap-3">{entries.slice(0, 4).map((e) => <li key={e.item.skuId}>{card(e)}</li>)}</ul>
        : <Rail label="Sản phẩm Flash sale" items={entries.map((e) => ({ key: e.item.skuId, node: card(e) }))} />}
    </section>
  )
}

function ModuleSkeleton({ n }: { n: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} role="status" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: n }, (_, i) => <div key={i} className="space-y-2"><Skeleton className="aspect-square w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-5 w-1/2" /></div>)}
    </div>
  )
}

function VoucherModule({ instant }: { instant: boolean }) {
  const w = useWorld()
  const t = useNow()
  const web = useLayout() === 'web'
  const ready = useLoaded([], instant ? 0 : undefined)
  const items = pickHomeVouchers(w.vouchers, w.savedVouchers, t).slice(0, web ? 2 : 3)
  if (!items.length) return null
  return (
    <section aria-labelledby="home-vouchers" className="panel h-full overflow-hidden p-3 lg:p-4">
      <SectionHead id="home-vouchers" title="Voucher Market" action={<ViewAll to="/vouchers" label="Xem thêm" />} className="items-center" />
      <ul role="list" className="no-scrollbar -mx-3 flex snap-x gap-2 overflow-x-auto scroll-px-3 px-3 lg:mx-0 lg:flex-col lg:gap-3 lg:px-0">
        {items.map(({ voucher }) => (
          <li key={voucher.id} className="w-[280px] shrink-0 snap-start lg:w-auto">
            {ready ? <VoucherTile voucher={voucher} className="h-full" /> : <Skeleton className="h-[120px] w-full" />}
          </li>
        ))}
      </ul>
    </section>
  )
}

const OFFICIAL = RAILS.find((r) => r.official)!

function OfficialModule({ instant }: { instant: boolean }) {
  const w = useWorld()
  const t = useNow()
  const ready = useLoaded([], instant ? 0 : undefined)
  const products = railProducts(w, OFFICIAL, t).slice(0, 6)
  if (!products.length) return null
  return (
    <section aria-label={OFFICIAL.title} className="panel h-full p-3 lg:p-4">
      <SectionHead title="Shop chính hãng" action={<ViewAll to={OFFICIAL.href} />} className="items-center" />
      {!ready ? <ModuleSkeleton n={3} /> : (
        <ul role="list" className="grid grid-cols-3 gap-2 lg:gap-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link to={`/p/${p.slug}`} title={p.name} className="group block no-underline">
                <Img src={p.images[0]} alt={p.name} className="aspect-square w-full rounded-[var(--radius-control)] transition-[filter] group-hover:brightness-[0.97]" />
                <PriceChip value={priceView(w, p, t).min} className="mt-1.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ── Themed rails (the official-shop rail lives in its module) ── */

function ThemedRails({ instant }: { instant: boolean }) {
  const w = useWorld()
  const t = useNow()
  const ready = useLoaded([], instant ? 0 : undefined)
  const rails = RAILS.filter((def) => def !== OFFICIAL).map((def) => ({ def, products: railProducts(w, def, t) })).filter((r) => r.products.length)
  return (
    <>
      {rails.map(({ def, products }) => (
        <SectionBoundary key={def.title}>
          <section aria-label={def.title} className="pt-2 lg:pt-4">
            <SectionHead title={<span className="block truncate">{def.title}</span>} action={<ViewAll to={def.href} />} className="items-center [&>h2]:min-w-0" />
            {ready ? <Rail label={def.title} items={products.map((p) => ({ key: p.id, node: <ProductCard product={p} /> }))} /> : <ModuleSkeleton n={3} />}
          </section>
        </SectionBoundary>
      ))}
    </>
  )
}

/* ── Gợi ý hôm nay ── */

function Recommendations({ back }: { back: boolean }) {
  const w = useWorld()
  const { slot: bandSlot } = useFlashBand()
  const [tab, setTab] = useState(() => (back ? readMemo().tab : 'all'))
  const [pages, setPages] = useState(() => (back ? readMemo().pages : 1))
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const cats = childrenOf(w).slice(0, 6)
  // Products already in the flash band are not recommended again.
  const exclude = useMemo(() => new Set(bandSlot ? flashEntries(w, bandSlot, 10).map((e) => e.product.id) : []), [w, bandSlot])
  const pool = useMemo(() => {
    if (tab === 'all') return w.products
    const leaves = new Set(leavesUnder(w, tab))
    return w.products.filter((p) => leaves.has(p.categoryId))
  }, [w, tab])
  const loaded = Array.from({ length: pages }, (_, i) => recommendationPage(pool, exclude, i))
  const items = loaded.flatMap((p) => p.items)
  const hasMore = loaded[loaded.length - 1]?.hasMore ?? false

  function pick(id: string) {
    setTab(id); setPages(1); writeMemo({ tab: id, pages: 1 })
  }
  async function more() {
    if (loading) return
    setLoading(true)
    await delay()
    setLoading(false)
    setPages((n) => { writeMemo({ pages: n + 1 }); return n + 1 })
  }
  const auto = hasMore && autoLoadAllowed(pages) && !loading
  useEffect(() => {
    const el = sentinel.current
    if (!auto || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) void more() }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [auto, pages, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-labelledby="home-recs" aria-busy={loading || undefined} className="pt-2 lg:pt-4">
      <div className="mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-6">
        <h2 id="home-recs" className="font-display text-[18px] leading-tight lg:text-[20px]">Gợi ý hôm nay</h2>
        <div role="group" aria-label="Lọc gợi ý theo danh mục" className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 lg:mx-0 lg:px-0">
          {[{ id: 'all', name: 'Tất cả' }, ...cats].map((c) => (
            <Chip key={c.id} selected={tab === c.id} onClick={() => pick(c.id)} className={cx('shrink-0', tab !== c.id && 'bg-surface!')}>{c.name}</Chip>
          ))}
        </div>
      </div>
      <ProductGrid products={items} />
      {loading && <div className="mt-3"><GridSkeleton n={REC_PAGE} /></div>}
      <div ref={sentinel} aria-hidden className="h-px" />
      {!loading && hasMore && !autoLoadAllowed(pages) && (
        <div className="mt-6 flex justify-center"><Button variant="secondary" className="w-full lg:w-auto lg:min-w-[240px]" onClick={() => void more()}>Xem thêm</Button></div>
      )}
      {!hasMore && <p className="mt-6 text-center text-[13px] text-muted">Bạn đã xem hết gợi ý hôm nay.</p>}
    </section>
  )
}

export default function HomePage() {
  const back = useNavigationType() === 'POP'
  const web = useLayout() === 'web'
  useScrollMemory(back)
  if (web) return (
    <div className="space-y-3 pb-6">
      <div className="grid grid-cols-[220px_minmax(0,1fr)_272px] gap-3">
        <SectionBoundary><CategoryList instant={back} /></SectionBoundary>
        <Banner />
        <BuyerCard />
      </div>
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <SectionBoundary><FlashModule instant={back} /></SectionBoundary>
        <SectionBoundary><VoucherModule instant={back} /></SectionBoundary>
        <SectionBoundary><OfficialModule instant={back} /></SectionBoundary>
      </div>
      <ThemedRails instant={back} />
      <SectionBoundary><Recommendations back={back} /></SectionBoundary>
    </div>
  )
  return (
    <div className="space-y-2 pb-4">
      <SectionBoundary><CategoryGrid instant={back} /></SectionBoundary>
      <SectionBoundary><FlashModule instant={back} /></SectionBoundary>
      <Banner />
      <SectionBoundary><VoucherModule instant={back} /></SectionBoundary>
      <SectionBoundary><OfficialModule instant={back} /></SectionBoundary>
      <ThemedRails instant={back} />
      <SectionBoundary><Recommendations back={back} /></SectionBoundary>
    </div>
  )
}

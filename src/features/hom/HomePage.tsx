// US-HOM-001…005: editorial hero, category shortcuts, flash-sale band, Voucher Market strip, themed rails, "Gợi ý hôm nay".
import { LayoutGrid } from 'lucide-react'
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigationType } from 'react-router'
import { useLayout } from '@/app/layout'
import { delay, useNow, useWorld } from '@/app/store'
import { ProductCard, ProductGrid } from '@/components/ProductCard'
import { Button, ButtonLink, cx, Img, PageTitle, SectionHead, Skeleton, useLoaded } from '@/components/ui'
import { pickHomeVouchers } from '@/features/prm/vouchers'
import { VoucherTile } from '@/features/prm/VoucherTile'
import { flashSlotState, formatCountdown, startLabel } from './flash'
import { FlashCard, flashEntries } from './FlashCard'
import { autoLoadAllowed, categoryTiles, HERO, kitchenMosaic, RAILS, railProducts, REC_PAGE, recommendationPage } from './home'
import { Rail } from './Rail'

/* ── Per-tab memory: scroll position and recommendation pages survive PDP → back (US-HOM-001) ── */

const KEY = 'market.home.v1'
type Memo = { y: number; pages: number }
const readMemo = (): Memo => { try { return { y: 0, pages: 1, ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') } } catch { return { y: 0, pages: 1 } } }
const writeMemo = (patch: Partial<Memo>) => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...readMemo(), ...patch })) } catch { /* private mode */ } }

function useScrollMemory(back: boolean) {
  useEffect(() => {
    if (!back) writeMemo({ y: 0, pages: 1 })
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

class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean; key: number }> {
  state = { failed: false, key: 0 }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <div className="flex items-center justify-between gap-3 rounded-[12px] bg-surface px-4 py-4 text-[14px]">
        <span className="text-ink-2">Không tải được mục này.</span>
        <Button variant="secondary" size="sm" onClick={() => this.setState((s) => ({ failed: false, key: s.key + 1 }))}>Thử lại</Button>
      </div>
    )
    return <div key={this.state.key}>{this.props.children}</div>
  }
}

/** Outlined pill on the web, a text link on the app so long section titles keep one line at 375px. */
function ViewAll({ to, label = 'Xem tất cả' }: { to: string; label?: string }) {
  const web = useLayout() === 'web'
  return <ButtonLink to={to} variant={web ? 'secondary' : 'link'} size="sm" className="shrink-0">{label}</ButtonLink>
}

/* ── Hero ── */

function Hero() {
  const w = useWorld()
  const mosaic = kitchenMosaic(w)
  const target = w.categories.some((c) => c.slug === HERO.cta.category) ? `/c/${HERO.cta.category}` : '/categories'
  return (
    <section aria-labelledby="home-hero" className="grid items-center gap-5 lg:grid-cols-12 lg:gap-10">
      <div className="order-2 lg:order-1 lg:col-span-5 lg:min-w-[360px] lg:py-6">
        <PageTitle className="text-[28px]! leading-[1.12]! tracking-[-0.015em] text-balance lg:text-[48px]! lg:leading-[1.06]! xl:text-[60px]!"><span id="home-hero">{HERO.headline}</span></PageTitle>
        <p className="mt-3 max-w-[44ch] text-[15px] text-ink-2 lg:mt-4 lg:text-[18px]">{HERO.subhead}</p>
        <ButtonLink to={target} size="lg" className="mt-5 w-full lg:mt-8 lg:w-auto">{HERO.cta.label}</ButtonLink>
      </div>
      <ul role="list" aria-label="Sản phẩm trong bộ sưu tập" className="order-1 grid grid-cols-3 gap-2 lg:order-2 lg:col-span-7 lg:gap-3">
        {mosaic.map((p, i) => (
          <li key={p.id} className={cx(i >= 3 && 'hidden lg:block')}>
            <Link to={`/p/${p.slug}`} className="block rounded-[var(--radius-media)]" aria-label={p.name}>
              <Img full src={p.images[0]} alt="" eager className="aspect-[4/5] w-full rounded-[var(--radius-media)] transition-[filter] hover:brightness-[0.97]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── Category shortcuts ── */

function CategoryShortcuts({ instant }: { instant: boolean }) {
  const w = useWorld()
  const ready = useLoaded([], instant ? 0 : undefined)
  const tiles = categoryTiles(w)
  if (ready && !tiles.length) return null
  const tile = 'flex flex-col items-center gap-2 text-center no-underline'
  const circle = 'size-16 rounded-full lg:size-[112px]'
  const label = 'line-clamp-2 min-h-[2lh] text-[12px] leading-4 text-ink lg:text-[14px] lg:leading-5'
  return (
    <section aria-labelledby="home-cats">
      <SectionHead id="home-cats" title="Mua sắm theo danh mục" />
      <ul role="list"
        className="no-scrollbar -mx-4 grid snap-x auto-cols-[calc((100%-48px)/4.5)] grid-flow-col grid-rows-2 gap-x-3 gap-y-4 overflow-x-auto scroll-px-4 px-4 lg:mx-0 lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-5 lg:grid-rows-none lg:gap-x-6 lg:gap-y-6 lg:overflow-visible lg:px-0 xl:flex xl:justify-between">
        {ready ? (<>
          {tiles.map(({ category: c, image }) => (
            <li key={c.id} className="snap-start">
              <Link to={`/c/${c.slug}`} className={cx(tile, 'group rounded-[12px]')}>
                <Img src={image} alt="" className={cx(circle, 'bg-surface! transition-[filter] group-hover:brightness-[0.96]')} />
                <span className={label}>{c.name}</span>
              </Link>
            </li>
          ))}
          <li className="snap-start lg:hidden">
            <Link to="/categories" className={tile}>
              <span className={cx(circle, 'flex items-center justify-center bg-well text-ink-2')}><LayoutGrid size={22} strokeWidth={1.6} aria-hidden /></span>
              <span className={label}>Tất cả danh mục</span>
            </Link>
          </li>
        </>) : Array.from({ length: 10 }, (_, i) => (
          <li key={i} className={tile} aria-hidden><Skeleton className={cx(circle, 'rounded-full!')} /><Skeleton className="h-3 w-14" /></li>
        ))}
      </ul>
    </section>
  )
}

/* ── Flash sale band ── */

function FlashBand({ instant }: { instant: boolean }) {
  const w = useWorld()
  const t = useNow()
  const ready = useLoaded([], instant ? 0 : undefined)
  const st = flashSlotState(w.flashSlots, t)
  const slot = st.active ?? st.next
  const entries = slot ? flashEntries(w, slot, 10) : []
  if (!slot || (ready && !entries.length)) return null
  const status = st.active ? `Đang diễn ra · Kết thúc sau ${formatCountdown(st.endsInMs!)}` : `Sắp diễn ra · ${startLabel(slot.startsAt, t)}`
  return (
    <section aria-labelledby="home-flash" className="-mx-4 bg-jade-soft/60 px-4 py-6 lg:mx-0 lg:rounded-[16px] lg:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 lg:flex lg:items-baseline lg:gap-4">
          <h2 id="home-flash" className="font-display text-[20px] leading-tight font-semibold lg:text-[24px]">Flash sale</h2>
          <p className="mt-1 text-[13px] text-ink/80 lg:mt-0 lg:text-[14px]">{status}</p>
        </div>
        <ViewAll to="/flash-sale" />
      </div>
      {ready ? <Rail label="Sản phẩm Flash sale" items={entries.map((e) => ({ key: e.item.skuId, node: <FlashCard entry={e} w={w} upcoming={!st.active} /> }))} />
        : <RailSkeleton />}
    </section>
  )
}

function RailSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-[40%] shrink-0 space-y-2 md:w-[27%] lg:w-[calc((100%-48px)/5)]"><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/3" /></div>
      ))}
    </div>
  )
}

/* ── Voucher Market strip ── */

function VoucherStrip({ instant }: { instant: boolean }) {
  const w = useWorld()
  const t = useNow()
  const ready = useLoaded([], instant ? 0 : undefined)
  const items = pickHomeVouchers(w.vouchers, w.savedVouchers, t)
  if (!items.length) return null
  return (
    <section aria-labelledby="home-vouchers">
      <SectionHead id="home-vouchers" title="Voucher Market" action={<ViewAll to="/vouchers" label="Xem thêm" />} />
      <ul role="list" className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
        {items.map(({ voucher }) => (
          <li key={voucher.id} className="w-[280px] shrink-0 snap-start lg:w-auto">
            {ready ? <VoucherTile voucher={voucher} className="h-full" /> : <Skeleton className="h-[132px] w-full rounded-[12px]" />}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── Themed rails ── */

function ThemedRails({ instant }: { instant: boolean }) {
  const w = useWorld()
  const t = useNow()
  const ready = useLoaded([], instant ? 0 : undefined)
  const rails = RAILS.map((def) => ({ def, products: railProducts(w, def, t) })).filter((r) => r.products.length)
  return (
    <>
      {rails.map(({ def, products }) => (
        <SectionBoundary key={def.title}>
          <section aria-label={def.title}>
            <SectionHead title={<span className="block truncate">{def.title}</span>} action={<ViewAll to={def.href} />} className="[&>h2]:min-w-0" />
            {ready ? <Rail label={def.title} items={products.map((p) => ({ key: p.id, node: <ProductCard product={p} /> }))} /> : <RailSkeleton />}
          </section>
        </SectionBoundary>
      ))}
    </>
  )
}

/* ── Gợi ý hôm nay ── */

function Recommendations({ back }: { back: boolean }) {
  const w = useWorld()
  const t = useNow()
  const [pages, setPages] = useState(() => (back ? readMemo().pages : 1))
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  // Products already in the flash band are not recommended again.
  const st = flashSlotState(w.flashSlots, t)
  const bandSlot = st.active ?? st.next
  const exclude = useMemo(() => new Set(bandSlot ? flashEntries(w, bandSlot, 10).map((e) => e.product.id) : []), [w, bandSlot])
  const loaded = Array.from({ length: pages }, (_, i) => recommendationPage(w.products, exclude, i))
  const items = loaded.flatMap((p) => p.items)
  const hasMore = loaded[loaded.length - 1]?.hasMore ?? false

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
  }, [auto, pages]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-labelledby="home-recs" aria-busy={loading || undefined}>
      <h2 id="home-recs" className="mb-4 font-display text-[24px] leading-tight font-semibold lg:text-[28px]">Gợi ý hôm nay</h2>
      <ProductGrid products={items} />
      {loading && <div className="mt-6"><SkeletonGrid n={REC_PAGE} /></div>}
      <div ref={sentinel} aria-hidden className="h-px" />
      {!loading && hasMore && !autoLoadAllowed(pages) && (
        <div className="mt-8 flex justify-center"><Button variant="secondary" className="w-full lg:w-auto lg:min-w-[240px]" onClick={() => void more()}>Xem thêm</Button></div>
      )}
      {!hasMore && <p className="mt-8 text-center text-[14px] text-muted">Bạn đã xem hết gợi ý hôm nay.</p>}
    </section>
  )
}

function SkeletonGrid({ n }: { n: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Đang tải thêm sản phẩm">
      {Array.from({ length: n }, (_, i) => <div key={i} className="space-y-2"><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/3" /></div>)}
    </div>
  )
}

export default function HomePage() {
  const back = useNavigationType() === 'POP'
  useScrollMemory(back)
  return (
    <div className="space-y-10 pb-6 lg:space-y-16 lg:pt-4">
      <Hero />
      <SectionBoundary><CategoryShortcuts instant={back} /></SectionBoundary>
      <SectionBoundary><FlashBand instant={back} /></SectionBoundary>
      <SectionBoundary><VoucherStrip instant={back} /></SectionBoundary>
      <ThemedRails instant={back} />
      <SectionBoundary><Recommendations back={back} /></SectionBoundary>
    </div>
  )
}

// US-SHP-001..004: /s/:handle with ?tab=shop|products|categories|reviews|about.
import { BadgeCheck, ChevronRight, MapPin, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { saveVoucher, savedUse, shopByHandle, toggleFollow, useNow, useWorld } from '@/app/store'
import { ProductCard, ProductRail } from '@/components/ProductCard'
import { Button, ButtonLink, Chip, cx, EmptyState, GridSkeleton, Img, PageTitle, SectionHead, Sheet, Skeleton, Stars, Tabs, toast, useLoaded } from '@/components/ui'
import { compactCount, compactVnd, vnd } from '@/domain/money'
import { voucherLabel } from '@/domain/pricing'
import type { Shop, Voucher } from '@/domain/types'
import NotFound from '@/features/demo/NotFound'
import { LoadMore, Pager, SortControl } from '@/features/dsc/Results'
import { buildIndex, groupDigits, paginate, sortRows, type Row, type Sort } from '@/features/dsc/search'
import { Monogram, OfficialBadge } from './bits'
import {
  expiryText, filterReviews, fmtDate, liveShopVouchers, parseShopTab, reviewSummary, SHOP_SORTS, SHOP_TABS, shopCategoryCounts, shopProducts, shopReviews,
  TAB_LABEL, voucherButtonState, type ShopTab,
} from './shop'

const PAGE = 40

export default function ShopPage() {
  const { handle = '' } = useParams()
  const w = useWorld()
  const t = useNow()
  const layout = useLayout()
  const [sp, setSp] = useSearchParams()
  const shop = shopByHandle(w, handle)
  const { tab, valid } = parseShopTab(sp.get('tab'))
  const rows = useMemo(() => (shop ? buildIndex(w, t).filter((r) => r.shop.id === shop.id) : []), [w, t, shop])
  const ready = useLoaded([handle])
  useEffect(() => { if (!valid) setSp({}, { replace: true }) }, [valid, setSp])
  useEffect(() => { if (shop) document.title = `${shop.name} · Market` }, [shop])
  if (!shop) return <NotFound what="Shop" />

  const setTab = (id: ShopTab) => setSp(id === 'shop' ? {} : { tab: id })
  return (
    <div className="pb-10">
      {ready ? <ShopHeader shop={shop} productCount={rows.length} /> : <HeaderSkeleton />}
      <Tabs label="Mục của Shop" value={tab} onChange={setTab} items={SHOP_TABS.map((id) => ({ id, label: TAB_LABEL[id] }))}
        className={cx('sticky z-30 mb-6 bg-ground', layout === 'web' ? 'top-[112px]' : '-mx-4 top-14 px-2')} />
      <div role="tabpanel" aria-label={TAB_LABEL[tab]}>
        {tab === 'shop' && <ShopHome shop={shop} rows={rows} />}
        {tab === 'products' && <ProductsTab shop={shop} rows={rows} />}
        {tab === 'categories' && <CategoriesTab shop={shop} rows={rows} />}
        {tab === 'reviews' && <ReviewsTab shop={shop} />}
        {tab === 'about' && <AboutTab shop={shop} productCount={rows.length} />}
      </div>
    </div>
  )
}

/* ── Header (US-SHP-001) ──────────────────────────────────────────── */

function HeaderSkeleton() {
  return <div className="mb-4 space-y-3" aria-busy="true" aria-label="Đang tải"><Skeleton className="h-[140px] w-full lg:h-[240px]" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></div>
}

function FollowButton({ shop }: { shop: Shop }) {
  const w = useWorld()
  const following = w.follows.includes(shop.id)
  const flip = () => {
    try {
      const on = toggleFollow(shop.id)
      if (on) toast('Đã theo dõi Shop')
      else toast('Đã bỏ theo dõi Shop', { action: { label: 'Hoàn tác', onClick: () => { try { toggleFollow(shop.id) } catch { toast('Không cập nhật được. Thử lại.', { tone: 'error' }) } } } })
    } catch {
      toast('Không cập nhật được. Thử lại.', { tone: 'error' })
    }
  }
  return (
    <Button variant={following ? 'secondary' : 'primary'} size="sm" aria-pressed={following} onClick={flip} className="shrink-0">
      {following ? 'Đang theo dõi' : 'Theo dõi'}
    </Button>
  )
}

function ShopHeader({ shop, productCount }: { shop: Shop; productCount: number }) {
  const layout = useLayout()
  const rating = `${shop.rating.toLocaleString('vi-VN')} ★ (${compactCount(shop.ratingCount)})`
  const followers = `${compactCount(shop.followers)} người theo dõi`
  const facts = [shop.provinceName, rating, followers, `${groupDigits(productCount)} sản phẩm`, `Tỉ lệ phản hồi ${shop.responseRate}%`, `Phản hồi ${shop.responseTime}`, `Tham gia ${fmtDate(shop.joinedAt)}`]

  if (layout === 'app')
    return (
      <header className="-mx-4 -mt-4 mb-3">
        <div className="relative h-[140px] overflow-hidden bg-well">
          {shop.banner && <Img src={shop.banner} alt="" className="absolute inset-0 size-full" />}
          {shop.banner && <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/45 to-ink/20" />}
          <div className="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <Monogram shop={shop} className="size-16 text-[22px] ring-2 ring-ground" />
            <div className={cx('min-w-0 flex-1', shop.banner ? 'text-ground' : 'text-ink')}>
              <PageTitle className="truncate text-[20px]! leading-tight"><span title={shop.name}>{shop.name}</span></PageTitle>
              <p className="mt-1 flex items-center gap-2 text-[12px]">
                {shop.isOfficial && <OfficialBadge className={shop.banner ? 'bg-ground! text-ink!' : ''} />}
                <span className="inline-flex items-center gap-1 truncate"><MapPin size={12} aria-hidden />{shop.provinceName}</span>
              </p>
            </div>
            <FollowButton shop={shop} />
          </div>
        </div>
        <dl className="grid grid-cols-3 border-b border-line bg-surface py-3 text-center">
          <div><dt className="text-[11px] text-muted">Đánh giá</dt><dd className="text-[14px] font-semibold">{rating}</dd></div>
          <div className="border-x border-line"><dt className="text-[11px] text-muted">Người theo dõi</dt><dd className="text-[14px] font-semibold">{compactCount(shop.followers)}</dd></div>
          <div><dt className="text-[11px] text-muted">Tỉ lệ phản hồi</dt><dd className="text-[14px] font-semibold">{shop.responseRate}%</dd></div>
        </dl>
        <p className="px-4 pt-2 text-[12px] text-muted">{[`${groupDigits(productCount)} sản phẩm`, `Phản hồi ${shop.responseTime}`, `Tham gia ${fmtDate(shop.joinedAt)}`].join(' · ')}</p>
      </header>
    )

  return (
    <header className="mb-4">
      {shop.banner ? <Img src={shop.banner} alt="" eager className="h-[240px] w-full rounded-[8px]" /> : <div className="h-[120px] rounded-[8px] bg-well" />}
      <div className="flex items-end gap-6 px-6">
        <Monogram shop={shop} className="-mt-12 size-24 text-[34px] ring-4 ring-ground" />
        <div className="min-w-0 flex-1 pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <PageTitle className="min-w-0 break-words">{shop.name}</PageTitle>
            {shop.isOfficial && <OfficialBadge />}
          </div>
          <p className="mt-1.5 text-[14px] text-muted">{facts.map((f, i) => <span key={i} className="inline-block">{i > 0 && <span aria-hidden className="mx-2">·</span>}{f}</span>)}</p>
        </div>
        <FollowButton shop={shop} />
      </div>
    </header>
  )
}

/* ── Shop tab: vouchers row + best sellers + all (US-SHP-002/003) ───── */

function VoucherRow({ shop }: { shop: Shop }) {
  const w = useWorld()
  const t = useNow()
  const [busy, setBusy] = useState<string>()
  const [detail, setDetail] = useState<Voucher>()
  const list = liveShopVouchers(w, shop.id, t)
  if (!list.length) return null
  const saved = new Set(w.savedVouchers.map((s) => s.voucherId))
  const stateOf = (v: Voucher) => voucherButtonState(v, saved.has(v.id), savedUse(w, v.id), t)
  const save = async (v: Voucher) => {
    setBusy(v.id)
    try {
      const ok = await saveVoucher(v.id)
      if (ok) toast('Đã lưu voucher'); else toast('Không lưu được voucher. Thử lại.', { tone: 'error' })
    } catch { toast('Không lưu được voucher. Thử lại.', { tone: 'error' }) } finally { setBusy(undefined) }
  }
  const label: Record<string, string> = { save: 'Lưu', saved: 'Đã lưu', sold_out: 'Đã hết lượt', used: 'Đã dùng' }
  const action = (v: Voucher, full?: boolean) => {
    const s = stateOf(v)
    return <Button size="sm" full={full} variant={s === 'save' ? 'primary' : 'secondary'} disabled={s !== 'save'} loading={busy === v.id} onClick={() => save(v)} aria-label={s === 'save' ? `Lưu voucher ${voucherLabel(v)}` : undefined}>{label[s]}</Button>
  }
  return (
    <section aria-labelledby="shop-vouchers" className="mb-10">
      <SectionHead id="shop-vouchers" title="Voucher của Shop" />
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {list.map((v) => {
          const out = stateOf(v) === 'sold_out' || stateOf(v) === 'used'
          return (
            <li key={v.id} className={cx('flex h-[88px] w-[240px] shrink-0 snap-start items-stretch rounded-[12px] bg-well lg:w-[280px]', out && 'opacity-70')}>
              <button type="button" onClick={() => setDetail(v)} className="min-w-0 flex-1 px-3.5 py-2.5 text-left" aria-label={`Điều kiện voucher ${voucherLabel(v)}`}>
                <span className="block truncate text-[15px] font-bold text-jade">{v.kind === 'percent' ? `Giảm ${v.value}%` : `Giảm ${compactVnd(v.value)}`}</span>
                <span className="block truncate text-[12px] text-ink-2">{v.kind === 'percent' && v.maxDiscount ? `Giảm tối đa ${compactVnd(v.maxDiscount)} · ` : ''}Đơn tối thiểu {compactVnd(v.minSpend)}</span>
                <span className="block truncate text-[12px] text-muted">{expiryText(v.endsAt, t)}</span>
              </button>
              <span aria-hidden className="my-2 border-l border-dashed border-line-strong" />
              <span className="flex w-[84px] shrink-0 items-center justify-center px-2">{action(v)}</span>
            </li>
          )
        })}
      </ul>
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(undefined)} title={detail ? voucherLabel(detail) : ''} dialog footer={detail && action(detail, true)}>
        {detail && (
          <dl className="space-y-2 text-[14px]">
            {[['Mã', detail.code], ['Áp dụng', `Sản phẩm của ${shop.name}`], ['Đơn tối thiểu', vnd(detail.minSpend)], ...(detail.maxDiscount ? [['Giảm tối đa', vnd(detail.maxDiscount)]] : []),
              ['Hạn sử dụng', `${fmtDate(detail.startsAt)} – ${fmtDate(detail.endsAt)}`], ['Lượt dùng', `Tối đa ${detail.perBuyerLimit} lần mỗi người`]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
        )}
      </Sheet>
    </section>
  )
}

function ShopHome({ shop, rows }: { shop: Shop; rows: Row[] }) {
  const ready = useLoaded([shop.id])
  const best = sortRows(rows, 'bestselling').slice(0, 10).map((r) => r.p)
  const popular = shopProducts(rows, shop.id, {}).slice(0, 20)
  return (
    <>
      <VoucherRow shop={shop} />
      {!rows.length ? <EmptyState title="Shop chưa có sản phẩm nào" /> : !ready ? <GridSkeleton n={10} /> : (
        <>
          <section aria-labelledby="shop-best" className="mb-10">
            <SectionHead id="shop-best" title="Bán chạy" />
            <ProductRail products={best} label={`Bán chạy của ${shop.name}`} />
          </section>
          <section aria-labelledby="shop-all">
            <SectionHead id="shop-all" title="Tất cả sản phẩm" action={<ButtonLink to="?tab=products" variant="secondary" size="sm">Xem tất cả</ButtonLink>} />
            <ShopGrid rows={popular} />
          </section>
        </>
      )}
    </>
  )
}

function ShopGrid({ rows }: { rows: Row[] }) {
  return (
    <ul role="list" className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
      {rows.map((r, i) => <li key={r.p.id}><ProductCard product={r.p} eager={i < 4} /></li>)}
    </ul>
  )
}

/* ── Products tab (US-SHP-002) ────────────────────────────────────── */

function ProductsTab({ shop, rows }: { shop: Shop; rows: Row[] }) {
  const layout = useLayout()
  const [sp, setSp] = useSearchParams()
  const q = (sp.get('q') ?? '').trim()
  const counts = shopCategoryCounts(rows, shop)
  const cat = counts.find((c) => c.id === sp.get('cat'))
  const options: Sort[] = q ? ['relevance', ...SHOP_SORTS] : SHOP_SORTS
  const sort = options.find((o) => o === sp.get('sort')) ?? (q ? 'relevance' : 'popular')
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const [text, setText] = useState(q)
  useEffect(() => setText(q), [q])
  const all = useMemo(() => shopProducts(rows, shop.id, { cat: cat?.id, q, sort }), [rows, shop.id, cat?.id, q, sort])
  const pg = paginate(all, page, PAGE)
  const shown = layout === 'app' ? all.slice(0, pg.page * PAGE) : pg.items
  const ready = useLoaded([shop.id, cat?.id, q, sort, layout === 'web' ? page : 0])

  const write = (patch: Record<string, string | undefined>, replace = false) => {
    const n = new URLSearchParams(sp); n.set('tab', 'products'); n.delete('page')
    for (const [k, v] of Object.entries(patch)) if (v) n.set(k, v); else n.delete(k)
    setSp(n, { replace })
  }

  const catList = (
    <nav aria-label="Danh mục của Shop" className="w-[240px] shrink-0">
      <ul className="max-h-[calc(100dvh-200px)] overflow-y-auto pr-2">
        {[{ id: '', name: 'Tất cả sản phẩm', n: rows.length }, ...counts].map((c) => {
          const on = (cat?.id ?? '') === c.id
          return (
            <li key={c.id || 'all'}>
              <button type="button" onClick={() => write({ cat: c.id || undefined })} aria-current={on ? 'true' : undefined}
                className={cx('relative flex w-full items-start justify-between gap-3 py-2 pr-1 pl-3 text-left text-[14px]', on ? 'font-semibold text-ink' : 'text-ink-2 hover:text-ink')}>
                {on && <span aria-hidden className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-ink" />}
                <span className="min-w-0 break-words">{c.name}</span><span className="tabular shrink-0 text-muted">{c.n}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )

  const body = !rows.length ? <EmptyState title="Shop chưa có sản phẩm nào" /> : !ready ? <GridSkeleton n={12} /> : !all.length ? (
    <EmptyState title="Không tìm thấy sản phẩm nào trong Shop" action={<Button variant="secondary" onClick={() => write({ q: undefined, cat: undefined, sort: undefined })}>Xem tất cả sản phẩm</Button>} />
  ) : (
    <>
      <ShopGrid rows={shown} />
      {layout === 'web'
        ? <Pager page={pg.page} pages={pg.pages} onPage={(n) => { const x = new URLSearchParams(sp); x.set('page', String(n)); setSp(x, { replace: true }); window.scrollTo({ top: 0 }) }} />
        : <LoadMore hasMore={pg.page < pg.pages} onMore={() => { const x = new URLSearchParams(sp); x.set('page', String(pg.page + 1)); setSp(x, { replace: true }) }} />}
    </>
  )

  return (
    <div className="flex gap-8">
      {layout === 'web' && catList}
      <div className="min-w-0 flex-1">
        <div className={cx('mb-4 flex items-center gap-2', layout === 'app' && 'sticky top-[100px] z-20 -mx-4 bg-ground/95 px-4 py-2')}>
          <form role="search" className="relative min-w-0 flex-1 lg:max-w-[420px]" onSubmit={(e) => { e.preventDefault(); const v = text.replace(/\s+/g, ' ').trim().slice(0, 100); write({ q: v || undefined, sort: undefined }) }}>
            <label htmlFor="shop-search" className="sr-only">Tìm trong Shop</label>
            <input id="shop-search" type="search" enterKeyHint="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Tìm trong Shop"
              className="h-11 w-full rounded-full bg-surface pr-12 pl-4 text-[14px] ring-1 ring-inset ring-line-strong outline-none focus:ring-2 focus:ring-jade" />
            <button type="submit" aria-label="Tìm trong Shop" className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full hover:bg-well"><Search size={17} aria-hidden /></button>
          </form>
          {layout === 'web' && <span className="flex-1" />}
          <SortControl value={sort} options={options} onChange={(s) => write({ sort: s })} />
        </div>
        {cat && <div className="mb-4"><Chip selected onClick={() => write({ cat: undefined })} aria-label={`Bỏ lọc ${cat.name}`}>{cat.name}<X size={14} aria-hidden /></Chip></div>}
        {body}
      </div>
    </div>
  )
}

/* ── Categories tab ───────────────────────────────────────────────── */

function CategoriesTab({ shop, rows }: { shop: Shop; rows: Row[] }) {
  const counts = shopCategoryCounts(rows, shop)
  return (
    <ul className="max-w-[640px] divide-y divide-line rounded-[12px] bg-surface">
      {[{ id: '', name: 'Tất cả sản phẩm', n: rows.length }, ...counts].map((c) => (
        <li key={c.id || 'all'}>
          <Link to={`?tab=products${c.id ? `&cat=${encodeURIComponent(c.id)}` : ''}`} className="flex min-h-12 items-center gap-3 px-4 text-[15px] no-underline hover:bg-well">
            <span className="min-w-0 flex-1 break-words">{c.name}</span>
            <span className="tabular text-[13px] text-muted">({c.n})</span>
            <ChevronRight size={16} aria-hidden className="text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/* ── Reviews tab (US-SHP-004) ─────────────────────────────────────── */

function ReviewsTab({ shop }: { shop: Shop }) {
  const w = useWorld()
  const [sp, setSp] = useSearchParams()
  const all = useMemo(() => shopReviews(w, shop.id), [w, shop.id])
  const sum = reviewSummary(all)
  const star = Number(sp.get('star')) || undefined
  const media = sp.get('media') === '1'
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const list = filterReviews(all, { star: star && star >= 1 && star <= 5 ? star : undefined, media })
  const shown = list.slice(0, page * 10)
  const ready = useLoaded([shop.id])
  const set = (patch: Record<string, string | undefined>, replace = false) => {
    const n = new URLSearchParams(sp); n.set('tab', 'reviews'); if (!('page' in patch)) n.delete('page')
    for (const [k, v] of Object.entries(patch)) if (v) n.set(k, v); else n.delete(k)
    setSp(n, { replace })
  }
  if (!all.length) return <EmptyState title="Shop chưa có đánh giá nào" />
  return (
    <div className="max-w-[760px]">
      <div className="flex flex-wrap items-center gap-6 rounded-[12px] bg-surface p-5">
        <div>
          <p className="font-display text-[28px] font-semibold">{sum.avg.toLocaleString('vi-VN')} <span className="text-[16px] font-normal text-muted">trên 5</span></p>
          <Stars value={sum.avg} count={sum.count} />
        </div>
        <ul className="min-w-[200px] flex-1 space-y-1" aria-label="Phân bố số sao">
          {sum.dist.map((d) => (
            <li key={d.star} className="flex items-center gap-2 text-[12px]">
              <span className="w-10 shrink-0 text-muted">{d.star} Sao</span>
              <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-well"><span className="block h-full bg-ink" style={{ width: `${(d.n / sum.count) * 100}%` }} /></span>
              <span className="tabular w-10 text-right text-muted">{d.n}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="no-scrollbar -mx-4 my-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Lọc đánh giá">
        <Chip selected={!star && !media} onClick={() => set({ star: undefined, media: undefined })}>Tất cả ({sum.count})</Chip>
        {sum.dist.map((d) => <Chip key={d.star} selected={star === d.star} onClick={() => set({ star: star === d.star ? undefined : String(d.star) })}>{d.star} Sao ({d.n})</Chip>)}
        <Chip selected={media} onClick={() => set({ media: media ? undefined : '1' })}>Có hình ảnh ({sum.media})</Chip>
      </div>
      {!ready ? <div className="space-y-4" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : !list.length ? (
        <p className="py-8 text-center text-[14px] text-muted">Chưa có đánh giá phù hợp</p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {shown.map(({ review: r, product: p, linkable, variant }) => (
              <li key={r.id} className="py-5">
                <div className="mb-3 flex items-center gap-3">
                  <Img src={p.images[0]} alt="" className="size-12 shrink-0 rounded-[6px]" />
                  <div className="min-w-0">
                    {linkable ? <Link to={`/p/${p.slug}`} className="line-clamp-1 text-[14px] font-medium no-underline hover:underline">{p.name}</Link> : <span className="line-clamp-1 text-[14px] font-medium">{p.name}</span>}
                    {variant && <p className="truncate text-[12px] text-muted">Phân loại: {variant}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="font-semibold">{r.buyerName}</span><Stars value={r.rating} size={13} /><span className="text-muted">{fmtDate(r.createdAt)}</span>
                </div>
                {r.text && <p className="mt-2 text-[14px] leading-6">{r.text}</p>}
                {r.photos.length > 0 && <div className="mt-2 flex gap-2">{r.photos.slice(0, 5).map((src, i) => <Img key={i} src={src} alt={`Ảnh đánh giá ${i + 1}`} className="size-16 rounded-[6px]" />)}</div>}
                {r.shopReply && <div className="mt-3 rounded-[10px] bg-well p-3 text-[13px]"><p className="font-semibold">Phản hồi của Shop</p><p className="mt-1 text-ink-2">{r.shopReply.text}</p></div>}
              </li>
            ))}
          </ul>
          {shown.length < list.length && <div className="mt-4 text-center"><Button variant="secondary" onClick={() => set({ page: String(page + 1) }, true)}>Xem thêm đánh giá</Button></div>}
        </>
      )}
    </div>
  )
}

/* ── About tab (US-SHP-004) ───────────────────────────────────────── */

function AboutTab({ shop, productCount }: { shop: Shop; productCount: number }) {
  const [more, setMore] = useState(false)
  const long = shop.about.length > 360
  const facts: [string, string][] = [
    ['Địa chỉ', shop.provinceName], ['Tham gia', fmtDate(shop.joinedAt)], ['Sản phẩm', `${groupDigits(productCount)} sản phẩm`],
    ['Tỉ lệ phản hồi', `${shop.responseRate}%`], ['Thời gian phản hồi', `Phản hồi ${shop.responseTime}`],
  ]
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      {shop.about ? (
        <section aria-labelledby="about-desc">
          <h2 id="about-desc" className="mb-3 font-display text-[20px] font-semibold lg:text-[24px]">Giới thiệu</h2>
          <p className={cx('max-w-[65ch] text-[15px] leading-7 whitespace-pre-line lg:text-[16px]', long && !more && 'line-clamp-[8]')}>{shop.about}</p>
          {long && <Button variant="link" className="mt-2" onClick={() => setMore((v) => !v)} aria-expanded={more}>{more ? 'Thu gọn' : 'Xem thêm'}</Button>}
        </section>
      ) : <span className="hidden lg:block" />}
      <div className="space-y-4 rounded-[12px] bg-well/60 p-5">
        <dl className="space-y-2 text-[14px]">
          {facts.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>)}
        </dl>
        {!shop.codEnabled && <p className="text-[14px] font-medium">Shop không hỗ trợ Thanh toán khi nhận hàng</p>}
        <details open className="border-t border-line pt-4">
          <summary className="flex cursor-pointer items-center justify-between gap-3 font-display text-[16px] font-semibold">Thông tin người bán<OfficialBadge label="Đã xác thực" /></summary>
          <dl className="mt-3 space-y-2.5 text-[14px]">
            <div><dt className="text-muted">Tên doanh nghiệp</dt><dd>{shop.legalName}</dd></div>
            <div><dt className="text-muted">Địa chỉ kinh doanh</dt><dd className="break-words">{shop.businessAddress}</dd></div>
            <div><dt className="text-muted">Mã số doanh nghiệp</dt><dd className="tabular">{shop.businessCode}</dd></div>
          </dl>
        </details>
        <section aria-labelledby="about-policy" className="border-t border-line pt-4">
          <h3 id="about-policy" className="mb-2 font-display text-[16px] font-semibold">Chính sách</h3>
          <ul className="space-y-1.5 text-[14px]">
            <li className="flex items-center gap-2"><BadgeCheck size={15} aria-hidden className="shrink-0 text-ink-2" />Trả hàng trong {shop.policies.returnDays} ngày theo chính sách của Market</li>
            {shop.policies.warranty && <li className="flex items-center gap-2"><BadgeCheck size={15} aria-hidden className="shrink-0 text-ink-2" />{shop.policies.warranty}</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}

// US-PDP-001…010: /p/:slug. Web: white panel with gallery left, info rows right; app: stacked white panels, sticky bottom bar opening the variant sheet.
import { ChevronRight, Heart, ShoppingCart, Store } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { activeProducts, ancestry } from '@/app/catalog'
import { useLayout } from '@/app/layout'
import { addToCart, productBySlug, shopById, startCheckout, toggleFavorite, useNow, useWorld } from '@/app/store'
import { ProductRail } from '@/components/ProductCard'
import { Button, cx, Img, PageTitle, QtyStepper, SectionHead, Sheet, Skeleton, Stars, toast, useLoaded } from '@/components/ui'
import { compactCount } from '@/domain/money'
import type { Category, Product } from '@/domain/types'
import NotFound from '@/features/demo/NotFound'
import { Gallery } from './Gallery'
import { clampQty, moreFromShop, overStock, priceBlock } from './pdp'
import { ReviewsSummary } from './Reviews'
import { Description, InfoRow, Policies, PriceBlockView, SellerInfo, ShippingRow, ShopCard, ShopVouchers, Specs } from './sections'
import { LOW_STOCK, useSkuSelection, VariantPicker } from './VariantPicker'
import { galleryImageFor, selectionText } from './variants'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const w = useWorld()
  const product = productBySlug(w, slug)
  const ready = useLoaded([slug])
  if (!product) return <NotFound what="sản phẩm" />
  if (!ready) return <PageSkeleton />
  return <ProductView key={product.id} product={product} />
}

function PageSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1280px] gap-8 lg:panel lg:grid-cols-[440px_minmax(0,1fr)] lg:p-5" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="-mx-3 -mt-3 aspect-square rounded-none lg:mx-0 lg:mt-0 lg:rounded-[var(--radius-card)]" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-4/5" /><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-5 h-20 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

function Breadcrumb({ crumbs, app }: { crumbs: Category[]; app: boolean }) {
  const shown: (Category | null)[] = app && crumbs.length > 2 ? [crumbs[0], null, crumbs[crumbs.length - 1]] : crumbs
  return (
    <nav aria-label="Đường dẫn danh mục" className="mb-3 text-[13px] text-muted">
      <ol className="flex min-w-0 items-center gap-1.5">
        {shown.map((c, i) => (
          <li key={c?.id ?? 'gap'} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} aria-hidden className="shrink-0" />}
            {c ? <Link to={`/c/${c.slug}`} className="truncate text-ink-2 hover:text-accent-ink">{c.name}</Link> : <span aria-label={crumbs.slice(1, -1).map((x) => x.name).join(', ')}>…</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function FavoriteButton({ product, className }: { product: Product; className?: string }) {
  const w = useWorld()
  const nav = useNavigate()
  const on = w.favorites.includes(product.id)
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Bỏ khỏi Yêu thích' : 'Thêm vào Yêu thích'}
      onClick={() => {
        const now = toggleFavorite(product.id)
        if (now) toast('Đã thêm vào Yêu thích', { action: { label: 'Xem', onClick: () => nav('/favorites') } })
        else toast('Đã bỏ khỏi Yêu thích', { action: { label: 'Hoàn tác', onClick: () => toggleFavorite(product.id) } })
      }}
      className={cx('absolute flex size-11 items-center justify-center rounded-full', className)}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-surface/90 shadow-[var(--shadow-hover)]">
        <Heart size={20} strokeWidth={1.75} aria-hidden className={cx('motion-safe:transition-transform', on ? 'fill-accent text-accent motion-safe:scale-110' : 'text-ink')} />
      </span>
    </button>
  )
}

type Mode = 'cart' | 'buy'

function ProductView({ product }: { product: Product }) {
  const w = useWorld()
  const layout = useLayout()
  const app = layout === 'app'
  const nav = useNavigate()
  const t = useNow(60_000)
  const shop = shopById(w, product.shopId)
  const crumbs = ancestry(w, product.categoryId)
  const { sel, setSel, skus, sku } = useSkuSelection(product)
  const [preview, setPreview] = useState<string>()
  const [qty, setQty] = useState(1)
  const [needPick, setNeedPick] = useState(false)
  const [msg, setMsg] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [sheet, setSheet] = useState<Mode | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { document.title = `${product.name} | Market` }, [product.name])
  useEffect(() => { setMsg(undefined); if (sku) { setNeedPick(false); setQty((q) => clampQty(q, sku.stock)) } }, [sku])

  const delisted = product.status === 'delisted'
  const soldOut = skus.every((k) => k.stock <= 0)
  const block = priceBlock(w, skus, sku, t)
  const flashLimit = sku && block.flash && !block.flash.soldOut ? block.flash.limit : 0
  const maxQty = sku ? Math.max(1, sku.stock) : Math.max(1, ...skus.map((k) => k.stock))
  const shownImage = preview ?? sku?.image ?? galleryImageFor(product.dimensions, sel)

  const requirePick = () => {
    setNeedPick(true)
    if (!app) {
      const d = sel.findIndex((o) => o == null)
      const group = pickerRef.current?.querySelectorAll('[role=radiogroup]')[d]
      group?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    }
  }

  async function add(): Promise<boolean> {
    if (!sku) { requirePick(); return false }
    const inCart = w.cart.find((l) => l.skuId === sku.id)?.qty ?? 0
    const over = overStock(inCart, qty, sku.stock)
    if (over != null) { setMsg(`Bạn đã có ${over} sản phẩm này trong giỏ hàng. Không thể thêm số lượng đã chọn vì vượt quá số lượng còn hàng.`); return false }
    setBusy(true)
    const r = await addToCart(sku.id, qty)
    setBusy(false)
    if (!r.ok) { toast('Sản phẩm vừa thay đổi số lượng còn hàng. Vui lòng chọn lại.', { tone: 'error' }); return false }
    toast(<span className="line-clamp-1">Đã thêm vào Giỏ hàng</span>, { action: { label: 'Xem giỏ hàng', onClick: () => nav('/cart') } })
    return true
  }
  function buyNow() {
    if (!sku) { requirePick(); return }
    startCheckout('buy_now', [{ skuId: sku.id, qty }])
    nav('/checkout')
  }

  const stockLine = soldOut
    ? <p className="text-[13px] font-medium text-ink-2">Sản phẩm đã hết hàng</p>
    : sku && sku.stock <= LOW_STOCK ? <p className="text-[13px] font-medium text-warn">Còn {sku.stock} sản phẩm</p> : null
  const pickLine = needPick && !sku ? <p role="alert" className="text-[13px] font-medium text-danger">Vui lòng chọn Phân loại hàng</p> : null
  const stepper = <QtyStepper value={qty} max={maxQty} onChange={(n) => { setQty(n); setMsg(undefined) }} disabled={soldOut || delisted} />
  const flashNote = flashLimit > 0 && qty > flashLimit
  const qtyNotes = (flashNote || msg) && (<>
    {flashNote && <p className="mt-2 text-[12px] text-ink-2">{flashLimit} sản phẩm đầu tiên giá Flash sale, các sản phẩm còn lại tính giá thường</p>}
    {msg && <p role="alert" className="mt-2 text-[13px] text-danger">{msg}</p>}
  </>)
  const quantity = (
    <div>
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-muted" id={`qty-${product.id}`}>Số lượng</span>
        {stepper}
        {stockLine}
      </div>
      {qtyNotes}
    </div>
  )
  const unavailablePill = delisted || soldOut ? <Button size="lg" full disabled>{delisted ? 'Sản phẩm đã ngừng bán' : 'Hết hàng'}</Button> : null

  const rule = <span aria-hidden className="h-3 w-px bg-line-strong" />
  const ratingLine = (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
      {product.ratingCount > 0 ? (<>
        <a href="#pdp-reviews" className="inline-flex items-center gap-1.5 no-underline hover:underline">
          <span className="tabular font-semibold text-accent-ink underline decoration-accent/40 underline-offset-2">{product.rating.toLocaleString('vi-VN')}</span>
          <Stars value={product.rating} size={13} />
        </a>
        {rule}
        <span><span className="tabular font-semibold text-ink">{compactCount(product.ratingCount)}</span> Đánh giá</span>
      </>) : <span className="text-muted">Chưa có đánh giá</span>}
      {rule}
      <span>Đã bán <span className="tabular font-semibold text-ink">{compactCount(product.soldCount)}</span></span>
    </div>
  )
  const title = <PageTitle className={cx('line-clamp-2 text-[18px]! leading-snug! lg:text-[22px]!', delisted && 'text-muted')}>{product.name}</PageTitle>
  const delistedNotice = delisted && (
    <div className="mt-4 rounded-[var(--radius-control)] bg-well p-4 text-[14px]">
      <p className="font-semibold">Sản phẩm này đã ngừng bán</p>
      {crumbs.length > 0 && <Link to={`/c/${crumbs[crumbs.length - 1].slug}`} className="mt-1 inline-block font-semibold text-accent-ink underline-offset-4 hover:underline">Xem sản phẩm tương tự</Link>}
    </div>
  )

  const more = moreFromShop(w.products, shop.id, product.id)
  const similar = delisted ? activeProducts(w).filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 10) : []
  const details = (
    <div className={cx('panel', app ? 'mt-2 space-y-6 p-3' : 'mt-3 space-y-8 p-5')}>
      <Specs product={product} crumbs={crumbs} shop={shop} collapsible={app} />
      <Description text={product.description} />
      {!app && (
        <section aria-label="Thông tin người bán" className="rounded-[var(--radius-control)] px-4 ring-1 ring-inset ring-line">
          <SellerInfo shop={shop} />
        </section>
      )}
    </div>
  )
  const belowFold = (
    <>
      {similar.length > 0 && <Section app={app}><SectionHead title="Sản phẩm tương tự" /><ProductRail products={similar} label="Sản phẩm tương tự" /></Section>}
      <Section app={app}><ShopCard shop={shop} disclosure={app} /></Section>
      {details}
      <Section app={app}><ReviewsSummary product={product} /></Section>
      {more.length > 0 && (
        <Section app={app}>
          <SectionHead title="Sản phẩm khác của Shop" action={<Link to={`/s/${shop.handle}?tab=products`} className="text-[14px] font-semibold text-accent-ink no-underline hover:underline">Xem tất cả</Link>} />
          <ProductRail products={more} label="Sản phẩm khác của Shop" />
        </Section>
      )}
    </>
  )
  const gallery = <Gallery images={product.images} alt={product.name} show={delisted ? undefined : shownImage} muted={delisted} overlay={<FavoriteButton product={product} className="top-2 right-2" />} />

  if (app)
    return (
      <div className="pb-[calc(72px+env(safe-area-inset-bottom))]">
        {gallery}
        <div className="panel mt-2 p-3">
          {!delisted && <PriceBlockView block={block} />}
          <div className="mt-3">{title}</div>
          {ratingLine}
          {delistedNotice}
        </div>
        {!delisted && (
          <div className="panel mt-2 px-3">
            <ShopVouchers shop={shop} />
            {product.dimensions.length > 0 && (
              <button type="button" onClick={() => setSheet('cart')} aria-haspopup="dialog" className="flex min-h-12 w-full items-center gap-2 border-t border-line text-left text-[14px]">
                <span className="text-muted">Phân loại:</span>
                <span className="min-w-0 flex-1 truncate font-medium">{selectionText(product, sel) || 'Chọn Phân loại'}</span>
                <ChevronRight size={16} aria-hidden className="text-muted" />
              </button>
            )}
            <div className="border-t border-line py-2"><ShippingRow product={product} shop={shop} weightGrams={product.weightGrams} muted={soldOut} /></div>
          </div>
        )}
        <div className="panel mt-2 p-3"><Policies product={product} shop={shop} /></div>
        {belowFold}

        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 bg-surface pt-2 pr-3 pl-1 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar)]">
          <Link to={`/s/${shop.handle}`} aria-label={`Xem shop ${shop.name}`} className="flex w-[52px] shrink-0 flex-col items-center gap-0.5 text-[11px] whitespace-nowrap text-ink-2 no-underline">
            <Store size={20} strokeWidth={1.75} aria-hidden />Shop
          </Link>
          <Link to="/cart" aria-label="Giỏ hàng" className="flex w-[52px] shrink-0 flex-col items-center gap-0.5 text-[11px] whitespace-nowrap text-ink-2 no-underline">
            <ShoppingCart size={20} strokeWidth={1.75} aria-hidden />Giỏ hàng
          </Link>
          <div className="ml-1 min-w-0 flex-1">
            {unavailablePill ?? (
              <div className="grid h-12 grid-cols-2 gap-2">
                <Button variant="accent" size="lg" className="px-2" onClick={() => setSheet('cart')}>Thêm vào giỏ</Button>
                <Button size="lg" className="px-2" onClick={() => setSheet('buy')}>Mua ngay</Button>
              </div>
            )}
          </div>
        </div>

        <Sheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} title={sheet === 'buy' ? 'Mua ngay' : 'Thêm vào giỏ'}
          footer={
            <div className="space-y-2">
              {!sku && <p className="text-center text-[13px] text-danger">Vui lòng chọn Phân loại hàng</p>}
              <Button size="lg" full disabled={!sku} loading={busy} onClick={async () => { if (sheet === 'buy') buyNow(); else if (await add()) setSheet(null) }}>{sheet === 'buy' ? 'Mua ngay' : 'Thêm vào giỏ'}</Button>
            </div>
          }>
          <div className="flex gap-3 pb-4">
            <Img src={shownImage ?? product.images[0]} alt="" className="size-24 shrink-0 rounded-[var(--radius-control)]" />
            <div className="min-w-0 flex-1 space-y-1.5 self-end">
              <PriceBlockView block={block} compact />
              {stockLine}
            </div>
          </div>
          <VariantPicker product={product} value={sel} onChange={setSel} className="border-t border-line pt-4" />
          <div className="mt-5 border-t border-line pt-4">{quantity}</div>
        </Sheet>
      </div>
    )

  return (
    <div className="mx-auto max-w-[1280px] pb-8">
      <Breadcrumb crumbs={crumbs} app={false} />
      <div className="panel grid grid-cols-[minmax(360px,440px)_minmax(0,1fr)] items-start gap-8 p-5">
        {gallery}
        <div className="min-w-0">
          {title}
          {ratingLine}
          {delistedNotice}
          {!delisted && <div className="mt-4"><PriceBlockView block={block} /></div>}
          <div className="mt-5 space-y-4 px-1">
            {!delisted && <ShopVouchers shop={shop} rows />}
            <ShippingRow product={product} shop={shop} weightGrams={product.weightGrams} muted={delisted || soldOut} rows />
            {!delisted && (<>
              <div ref={pickerRef} className="space-y-2">
                {pickLine && <div className="pl-[100px]">{pickLine}</div>}
                <VariantPicker product={product} value={sel} onChange={setSel} onPreview={setPreview} rows />
              </div>
              <InfoRow label="Số lượng" labelId={`qty-${product.id}`} className="items-center">
                <div className="flex flex-wrap items-center gap-4">{stepper}{stockLine}</div>
              </InfoRow>
              {qtyNotes && <div className="-mt-2 pl-[100px]">{qtyNotes}</div>}
            </>)}
          </div>
          <div className="mt-6 grid max-w-[480px] grid-cols-2 gap-3">
            {unavailablePill ? <div className="col-span-2">{unavailablePill}</div> : (<>
              <Button size="lg" variant="accent" loading={busy} onClick={() => void add()} className="h-12">Thêm vào giỏ</Button>
              <Button size="lg" onClick={buyNow} className="h-12">Mua ngay</Button>
            </>)}
          </div>
          <div className="mt-6 border-t border-line pt-4"><InfoRow label="Đảm bảo"><Policies product={product} shop={shop} /></InfoRow></div>
        </div>
      </div>
      {belowFold}
    </div>
  )
}

function Section({ app, children }: { app: boolean; children: ReactNode }) {
  return <div className={cx('panel', app ? 'mt-2 p-3' : 'mt-3 p-5')}>{children}</div>
}


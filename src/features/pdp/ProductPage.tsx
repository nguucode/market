// US-PDP-001…010: /p/:slug. Web: gallery + sticky right column; app: stacked sections, sticky bottom bar opening the variant sheet.
import { Heart } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { activeProducts, ancestry } from '@/app/catalog'
import { useLayout } from '@/app/layout'
import { addToCart, productBySlug, shopById, startCheckout, toggleFavorite, useNow, useWorld } from '@/app/store'
import { ProductRail } from '@/components/ProductCard'
import { Button, cx, Img, PageTitle, QtyStepper, SectionHead, Sheet, Skeleton, toast, useLoaded, RatingText } from '@/components/ui'
import { compactCount } from '@/domain/money'
import type { Category, Product } from '@/domain/types'
import NotFound from '@/features/demo/NotFound'
import { Gallery } from './Gallery'
import { clampQty, moreFromShop, overStock, priceBlock } from './pdp'
import { ReviewsSummary } from './Reviews'
import { Description, Policies, PriceBlockView, ShippingRow, ShopCard, ShopVouchers, Specs } from './sections'
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
    <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[minmax(0,1fr)_420px]" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="-mx-4 -mt-4 aspect-[4/5] rounded-none lg:mx-0 lg:mt-0 lg:ml-[84px] lg:rounded-[8px]" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-4/5" /><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-5 h-6 w-1/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full rounded-full" />
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
            {i > 0 && <span aria-hidden>›</span>}
            {c ? <Link to={`/c/${c.slug}`} className="truncate text-ink-2 hover:text-ink">{c.name}</Link> : <span aria-label={crumbs.slice(1, -1).map((x) => x.name).join(', ')}>…</span>}
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
      <span className="flex size-10 items-center justify-center rounded-full bg-ground/90 shadow-[0_1px_3px_rgb(32_20_8/0.12)]">
        <Heart size={20} strokeWidth={1.75} aria-hidden className={cx('text-ink motion-safe:transition-transform', on && 'fill-ink motion-safe:scale-110')} />
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
  const quantity = (
    <div>
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-muted" id={`qty-${product.id}`}>Số lượng</span>
        <QtyStepper value={qty} max={maxQty} onChange={(n) => { setQty(n); setMsg(undefined) }} disabled={soldOut || delisted} />
        {stockLine}
      </div>
      {flashLimit > 0 && qty > flashLimit && <p className="mt-2 text-[12px] text-ink-2">{flashLimit} sản phẩm đầu tiên giá Flash sale, các sản phẩm còn lại tính giá thường</p>}
      {msg && <p role="alert" className="mt-2 text-[13px] text-danger">{msg}</p>}
    </div>
  )
  const unavailablePill = delisted || soldOut ? <Button size="lg" full disabled>{delisted ? 'Sản phẩm đã ngừng bán' : 'Hết hàng'}</Button> : null

  const ratingLine = (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-2">
      {product.ratingCount > 0 ? <a href="#pdp-reviews" className="no-underline hover:underline"><RatingText value={product.rating} count={compactCount(product.ratingCount)} /></a> : <span className="text-muted">Chưa có đánh giá</span>}
      <span aria-hidden className="text-muted">·</span>
      <span>Đã bán {compactCount(product.soldCount)}</span>
    </p>
  )
  const title = <PageTitle className={cx('font-normal! text-[20px]! leading-snug! lg:text-[24px]!', delisted && 'text-muted')}>{product.name}</PageTitle>
  const delistedNotice = delisted && (
    <div className="mt-4 rounded-[12px] bg-well p-4 text-[14px]">
      <p className="font-semibold">Sản phẩm này đã ngừng bán</p>
      {crumbs.length > 0 && <Link to={`/c/${crumbs[crumbs.length - 1].slug}`} className="mt-1 inline-block font-semibold text-jade-ink underline-offset-4 hover:underline">Xem sản phẩm tương tự</Link>}
    </div>
  )

  const more = moreFromShop(w.products, shop.id, product.id)
  const similar = delisted ? activeProducts(w).filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 10) : []
  const belowFold = (
    <>
      {similar.length > 0 && <Section app={app}><SectionHead title="Sản phẩm tương tự" /><ProductRail products={similar} label="Sản phẩm tương tự" /></Section>}
      <Section app={app}><ShopCard shop={shop} /></Section>
      <Section app={app}><Specs product={product} crumbs={crumbs} shop={shop} collapsible={app} /></Section>
      <Section app={app}><Description text={product.description} /></Section>
      <Section app={app}><ReviewsSummary product={product} /></Section>
      {more.length > 0 && (
        <Section app={app}>
          <SectionHead title="Sản phẩm khác của Shop" action={<Link to={`/s/${shop.handle}?tab=products`} className="text-[14px] font-semibold text-ink-2 hover:text-ink">Xem tất cả</Link>} />
          <ProductRail products={more} label="Sản phẩm khác của Shop" />
        </Section>
      )}
    </>
  )
  const gallery = <Gallery images={product.images} alt={product.name} show={delisted ? undefined : shownImage} muted={delisted} overlay={<FavoriteButton product={product} className="top-2 right-2" />} />

  if (app)
    return (
      <div className="pb-[calc(80px+env(safe-area-inset-bottom))]">
        {gallery}
        <div className="-mx-4 bg-surface px-4 pt-4 pb-4">
          {!delisted && <PriceBlockView block={block} />}
          <div className="mt-2">{title}</div>
          {ratingLine}
          {delistedNotice}
        </div>
        {!delisted && (
          <>
            <div className="-mx-4 mt-2 bg-surface px-4 py-1"><ShopVouchers shop={shop} /></div>
            <div className="-mx-4 mt-2 bg-surface px-4">
              {product.dimensions.length > 0 && (
                <button type="button" onClick={() => setSheet('cart')} aria-haspopup="dialog" className="flex min-h-12 w-full items-center gap-2 border-b border-line text-left text-[14px]">
                  <span className="text-muted">Phân loại:</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{selectionText(product, sel) || 'Chọn Phân loại'}</span>
                  <span aria-hidden className="text-muted">›</span>
                </button>
              )}
              <div className="py-2"><ShippingRow product={product} shop={shop} weightGrams={product.weightGrams} muted={soldOut} /></div>
            </div>
          </>
        )}
        <div className="-mx-4 mt-2 bg-surface px-4 py-4"><Policies product={product} shop={shop} /></div>
        {belowFold}

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ground px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
          {unavailablePill ?? (
            <div className="grid h-12 grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" onClick={() => setSheet('cart')}>Thêm vào giỏ</Button>
              <Button size="lg" onClick={() => setSheet('buy')}>Mua ngay</Button>
            </div>
          )}
        </div>

        <Sheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} title={sheet === 'buy' ? 'Mua ngay' : 'Thêm vào giỏ'}
          footer={
            <div className="space-y-2">
              {!sku && <p className="text-center text-[13px] text-danger">Vui lòng chọn Phân loại hàng</p>}
              <Button size="lg" full disabled={!sku} loading={busy} onClick={async () => { if (sheet === 'buy') buyNow(); else if (await add()) setSheet(null) }}>{sheet === 'buy' ? 'Mua ngay' : 'Thêm vào giỏ'}</Button>
            </div>
          }>
          <div className="flex gap-3 pb-4">
            <Img src={shownImage ?? product.images[0]} alt="" className="size-24 shrink-0 rounded-[8px]" />
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
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(400px,440px)] items-start gap-12">
        {gallery}
        <div className="sticky top-[132px] space-y-5">
          <div>
            {title}
            {ratingLine}
            {delistedNotice}
          </div>
          {!delisted && (
            <>
              <PriceBlockView block={block} />
              <ShopVouchers shop={shop} />
              <div ref={pickerRef} className="space-y-2">
                {pickLine}
                <VariantPicker product={product} value={sel} onChange={setSel} onPreview={setPreview} />
              </div>
              {quantity}
            </>
          )}
          <div className="space-y-3">
            {unavailablePill ?? (<>
              <Button size="lg" full onClick={buyNow} className="h-12">Mua ngay</Button>
              <Button size="lg" full variant="secondary" loading={busy} onClick={() => void add()} className="h-12">Thêm vào giỏ</Button>
            </>)}
          </div>
          <div className="border-t border-line pt-4"><ShippingRow product={product} shop={shop} weightGrams={product.weightGrams} muted={delisted || soldOut} /></div>
          <div className="border-t border-line pt-4"><Policies product={product} shop={shop} /></div>
        </div>
      </div>
      {belowFold}
    </div>
  )
}

function Section({ app, children }: { app: boolean; children: ReactNode }) {
  return app ? <div className="-mx-4 mt-2 bg-surface px-4 py-5">{children}</div> : <div className="mt-12 border-t border-line pt-8">{children}</div>
}


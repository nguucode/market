// US-FND-007: white price-led card: square image, one label, two-line name, lowest price in the accent, sold count.
import { Heart } from 'lucide-react'
import { Link } from 'react-router'
import { cardLabel, priceView, spreadSiblings } from '@/app/catalog'
import { toggleFavorite, useNow, useWorld } from '@/app/store'
import { compactCount } from '@/domain/money'
import type { Product } from '@/domain/types'
import { cx, Img, Price, RatingText, toast } from './ui'

const LABEL_TONE = {
  deal: 'text-accent-ink ring-1 ring-inset ring-accent/60',
  muted: 'bg-ink/75 text-white',
  plain: 'text-ink-2 ring-1 ring-inset ring-line-strong',
} as const

export function ProductCard({ product: p, eager, className, showShopLocation }: { product: Product; eager?: boolean; className?: string; showShopLocation?: boolean }) {
  const w = useWorld()
  const t = useNow()
  const pv = priceView(w, p, t)
  const label = cardLabel(w, p, pv)
  const fav = w.favorites.includes(p.id)
  const shop = w.shops.find((s) => s.id === p.shopId)!
  const out = label?.tone === 'muted'
  return (
    <article className={cx('group panel relative h-full min-w-0 overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-hover)]', className)}>
      <Link to={`/p/${p.slug}`} className="flex h-full flex-col no-underline">
        <span className="relative block">
          <Img src={p.images[0]} alt={p.name} eager={eager} className={cx('aspect-square w-full bg-surface! transition-transform duration-300 group-hover:scale-[1.02]', out && 'opacity-55')} />
          {out && <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[12px] font-semibold text-white">{label.text}</span>}
        </span>
        <span className="flex flex-1 flex-col px-2.5 pt-2 pb-2.5">
          <h3 className="line-clamp-2 min-h-10 text-[14px] leading-5 font-medium text-ink" title={p.name}>{p.name}</h3>
          <span className="mt-1.5 flex h-[18px] items-center">
            {label && !out && <span className={cx('inline-flex h-[18px] items-center rounded-[4px] px-1.5 text-[11px] leading-none font-semibold', LABEL_TONE[label.tone])}>{label.text}</span>}
          </span>
          <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
            <Price price={pv.min} size="md" showStruck={false} />
            <span className="shrink-0 text-[12px] text-muted">Đã bán {compactCount(p.soldCount)}</span>
          </span>
          {(p.ratingCount > 0 || showShopLocation) && (
            <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
              {p.ratingCount > 0 && <RatingText value={p.rating} className="text-ink-2 [&_svg]:text-accent" />}
              {showShopLocation && <><span aria-hidden>·</span><span className="truncate">{shop.provinceName}</span></>}
            </span>
          )}
        </span>
      </Link>
      <button
        type="button"
        aria-pressed={fav}
        aria-label={fav ? `Bỏ yêu thích ${p.name}` : `Yêu thích ${p.name}`}
        onClick={() => { const on = toggleFavorite(p.id); toast(on ? 'Đã thêm vào Yêu thích' : 'Đã bỏ khỏi Yêu thích', { action: { label: 'Hoàn tác', onClick: () => toggleFavorite(p.id) } }) }}
        className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-surface/90 shadow-[0_1px_3px_rgb(20_20_30/0.14)] transition-transform active:scale-90">
          <Heart size={16} strokeWidth={1.75} aria-hidden className={fav ? 'fill-accent text-accent' : 'text-ink-2'} />
        </span>
      </button>
    </article>
  )
}

/** Six columns at 1440: siblings stay 7 apart so they never share a row or sit straight above one another. */
export function ProductGrid({ products: raw, eagerFirst = 0 }: { products: Product[]; eagerFirst?: number }) {
  const products = spreadSiblings(raw, (p) => p)
  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-5 xl:grid-cols-6" role="list">
      {products.map((p, i) => <li key={p.id}><ProductCard product={p} eager={i < eagerFirst} /></li>)}
    </ul>
  )
}

/** Horizontal rail with peek on the app layout. */
export function ProductRail({ products: raw, label }: { products: Product[]; label: string }) {
  const products = spreadSiblings(raw, (p) => p)
  return (
    <ul aria-label={label} className="no-scrollbar -mx-3 flex snap-x gap-2 overflow-x-auto px-3 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible lg:px-0 xl:grid-cols-6" role="list">
      {products.map((p) => <li key={p.id} className="w-[40%] shrink-0 snap-start md:w-[28%] lg:w-auto"><ProductCard product={p} /></li>)}
    </ul>
  )
}

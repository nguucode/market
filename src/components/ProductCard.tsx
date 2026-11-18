// US-FND-007: borderless image-led card, 4:5 image, one label, one-line name, lowest price.
import { Heart } from 'lucide-react'
import { Link } from 'react-router'
import { cardLabel, priceView, spreadSiblings } from '@/app/catalog'
import { toggleFavorite, useNow, useWorld } from '@/app/store'
import { compactCount } from '@/domain/money'
import type { Product } from '@/domain/types'
import { cx, Img, Price, RatingText, toast } from './ui'

export function ProductCard({ product: p, eager, className, showShopLocation }: { product: Product; eager?: boolean; className?: string; showShopLocation?: boolean }) {
  const w = useWorld()
  const t = useNow()
  const pv = priceView(w, p, t)
  const label = cardLabel(w, p, pv)
  const fav = w.favorites.includes(p.id)
  const shop = w.shops.find((s) => s.id === p.shopId)!
  const out = label?.tone === 'muted'
  return (
    <article className={cx('group relative min-w-0', className)}>
      <Link to={`/p/${p.slug}`} className="block no-underline">
        <span className="relative block">
          <Img src={p.images[0]} alt={p.name} eager={eager} className={cx('aspect-[4/5] w-full rounded-[var(--radius-media)] transition-[filter] duration-200 group-hover:brightness-[0.97]', out && 'opacity-60')} />
          {label && (
            <span className={cx('absolute top-2 left-2 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold shadow-[0_1px_2px_rgb(32_20_8/0.08)]', label.tone === 'deal' ? 'bg-surface text-jade-ink' : label.tone === 'muted' ? 'bg-ink/80 text-ground' : 'bg-surface text-ink-2')}>{label.text}</span>
          )}
        </span>
        <h3 className="mt-2 truncate text-[14px] leading-5 text-ink" title={p.name}>{p.name}</h3>
        <Price price={pv.min} size="md" showStruck={false} className="mt-0.5" />
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
          {p.ratingCount > 0 && <><RatingText value={p.rating} className="text-ink-2" /><span aria-hidden>·</span></>}
          <span>Đã bán {compactCount(p.soldCount)}</span>
          {showShopLocation && <><span aria-hidden>·</span><span className="truncate">{shop.provinceName}</span></>}
        </p>
      </Link>
      <button
        type="button"
        aria-pressed={fav}
        aria-label={fav ? `Bỏ yêu thích ${p.name}` : `Yêu thích ${p.name}`}
        onClick={() => { const on = toggleFavorite(p.id); toast(on ? 'Đã thêm vào Yêu thích' : 'Đã bỏ khỏi Yêu thích', { action: { label: 'Hoàn tác', onClick: () => toggleFavorite(p.id) } }) }}
        className="absolute top-1.5 right-1.5 flex size-11 items-center justify-center rounded-full"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-surface/95 shadow-[0_1px_3px_rgb(32_20_8/0.12)] transition-transform active:scale-90">
          <Heart size={16} strokeWidth={1.75} aria-hidden className={fav ? 'fill-ink text-ink' : 'text-ink'} />
        </span>
      </button>
    </article>
  )
}

export function ProductGrid({ products: raw, eagerFirst = 0 }: { products: Product[]; eagerFirst?: number }) {
  const products = spreadSiblings(raw, (p) => p)
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="list">
      {products.map((p, i) => <li key={p.id}><ProductCard product={p} eager={i < eagerFirst} /></li>)}
    </ul>
  )
}

/** Horizontal rail with peek on the app layout. */
export function ProductRail({ products: raw, label }: { products: Product[]; label: string }) {
  const products = spreadSiblings(raw, (p) => p)
  return (
    <ul aria-label={label} className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0" role="list">
      {products.map((p) => <li key={p.id} className="w-[42%] shrink-0 snap-start md:w-[28%] lg:w-auto"><ProductCard product={p} /></li>)}
    </ul>
  )
}

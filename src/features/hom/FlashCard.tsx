// Product card in the flash variant (US-FND-007): slot price in the deal colour, -NN%, the sold bar. Shared with PRM.
import { Link } from 'react-router'
import { compactCount, discountPct, vnd } from '@/domain/money'
import type { FlashItem, FlashSlot, Product } from '@/domain/types'
import type { World } from '@/mock/seed'
import { cx, Img } from '@/components/ui'
import { almostGone, orderFlashItems, soldOut } from './flash'

export type FlashEntry = { item: FlashItem; product: Product }
/** A slot's items with their products, delisted dropped, sold-out last. */
export function flashEntries(w: World, slot: FlashSlot, limit = Infinity): FlashEntry[] {
  const live = slot.items.filter((i) => w.products.find((p) => p.id === i.productId)?.status === 'active').slice(0, limit)
  return orderFlashItems(live).map((item) => ({ item, product: w.products.find((p) => p.id === item.productId)! }))
}

export function FlashCard({ entry: { item, product }, w, upcoming, showLimit }: { entry: FlashEntry; w: World; upcoming?: boolean; showLimit?: boolean }) {
  const sku = w.skus.find((k) => k.id === item.skuId)
  const pct = discountPct(item.salePrice, sku ? sku.priceBeforePromo ?? sku.price : undefined)
  const out = !upcoming && soldOut(item)
  const sold = Math.min(100, Math.round((item.sold / item.quota) * 100))
  return (
    <article className="min-w-0">
      <Link to={`/p/${product.slug}?sku=${item.skuId}`} className="group block no-underline">
        <Img src={sku?.image ?? product.images[0]} alt={product.name} className={cx('aspect-[4/5] w-full rounded-[var(--radius-media)] transition-[filter] group-hover:brightness-[0.97]', out && 'opacity-50')} />
        <h3 className={cx('mt-2 truncate text-[14px] leading-5', out ? 'text-muted' : 'text-ink')} title={product.name}>{product.name}</h3>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className={cx('tabular text-[16px] font-bold', out ? 'text-muted' : 'text-jade')}>{vnd(item.salePrice)}</span>
          {pct > 0 && <span className="text-[12px] font-semibold text-jade-ink">-{pct}%</span>}
        </p>
        {upcoming ? <p className="mt-1.5 text-[12px] text-ink-2">Sắp diễn ra</p> : (
          <div className="mt-1.5">
            <span aria-hidden className="block h-1 overflow-hidden rounded-full bg-jade/15"><span className="block h-full rounded-full bg-jade" style={{ width: `${sold}%` }} /></span>
            <p className="mt-1 flex items-baseline justify-between gap-2 text-[12px]">
              <span className="text-ink-2">{out ? 'Đã bán hết' : `Đã bán ${compactCount(item.sold)}`}</span>
              {almostGone(item) && <span className="font-semibold text-jade-ink">Sắp hết</span>}
            </p>
          </div>
        )}
        {showLimit && <p className="mt-0.5 text-[12px] text-muted">Tối đa {item.perBuyerLimit} sản phẩm</p>}
      </Link>
    </article>
  )
}

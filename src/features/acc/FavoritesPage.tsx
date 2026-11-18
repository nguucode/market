// US-ACC-004: favourite products, out-of-stock and delisted ones kept in the list.
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { useLayout } from '@/app/layout'
import { skusOf, toggleFavorite, useWorld } from '@/app/store'
import { ProductCard } from '@/components/ProductCard'
import { Button, ButtonLink, EmptyState, GridSkeleton, Img, PageTitle, toast, useLoaded } from '@/components/ui'
import type { Product } from '@/domain/types'
import { favoriteCardState } from './account'

const PAGE = 24

export default function FavoritesPage() {
  const loaded = useLoaded()
  const web = useLayout() === 'web'
  const w = useWorld()
  const [shown, setShown] = useState(PAGE)
  const products = w.favorites.map((id) => w.products.find((p) => p.id === id)!).filter(Boolean)

  return (
    <div className="pb-12">
      <div className={web ? 'panel mb-3 flex items-baseline gap-3 px-5 py-4' : 'mb-2'}>
        <PageTitle className={web ? undefined : 'sr-only'}>Yêu thích</PageTitle>
        {loaded && products.length > 0 && <p className="text-[13px] text-muted">{products.length} sản phẩm</p>}
      </div>
      {!loaded ? <GridSkeleton n={web ? 8 : 4} />
        : !products.length ? (
          <div className="panel"><EmptyState icon={<Heart size={24} />} title="Chưa có sản phẩm yêu thích" body="Nhấn ♡ trên sản phẩm để lưu vào đây" action={<ButtonLink to="/">Khám phá ngay</ButtonLink>} /></div>
        ) : (<>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-5 xl:grid-cols-6" role="list">
            {products.slice(0, shown).map((p, i) => (
              <li key={p.id}>{favoriteCardState(p, skusOf(w, p.id)) === 'delisted' ? <DelistedCard p={p} /> : <ProductCard product={p} eager={i < 4} />}</li>
            ))}
          </ul>
          {shown < products.length && <div className="mt-8 text-center"><Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Xem thêm</Button></div>}
        </>)}
    </div>
  )
}

/** Delisted: greyed, no link, only the heart to remove it. */
function DelistedCard({ p }: { p: Product }) {
  const remove = () => { toggleFavorite(p.id); toast('Đã bỏ khỏi Yêu thích', { action: { label: 'Hoàn tác', onClick: () => toggleFavorite(p.id) } }) }
  return (
    <article className="panel relative h-full min-w-0 overflow-hidden">
      <div className="opacity-50">
        <Img src={p.images[0]} alt={p.name} className="aspect-square w-full" />
        <h3 className="line-clamp-2 min-h-10 px-2.5 pt-2 text-[14px] leading-5 font-medium" title={p.name}>{p.name}</h3>
      </div>
      <p className="px-2.5 pt-1.5 pb-2.5 text-[13px] text-ink-2">Sản phẩm không còn bán</p>
      <button type="button" aria-pressed aria-label={`Bỏ yêu thích ${p.name}`} onClick={remove} className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full">
        <span className="flex size-8 items-center justify-center rounded-full bg-surface/95 shadow-[0_1px_3px_rgb(20_20_30/0.14)]"><Heart size={16} strokeWidth={1.75} aria-hidden className="fill-accent text-accent" /></span>
      </button>
    </article>
  )
}

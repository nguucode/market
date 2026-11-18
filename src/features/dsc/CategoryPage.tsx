// US-DSC-002: /c/:slug. Level 1-2: breadcrumb, subcategory tiles, "Bán chạy" rail, results. Level 3: results only.
import { ChevronRight } from 'lucide-react'
import { Fragment, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { ancestry, childrenOf, leavesUnder } from '@/app/catalog'
import { useLayout } from '@/app/layout'
import { useWorld } from '@/app/store'
import { ProductRail } from '@/components/ProductCard'
import { ButtonLink, cx, GridSkeleton, Img, PageTitle, useLoaded } from '@/components/ui'
import NotFound from '@/features/demo/NotFound'
import { Results, TodayPicks } from './Results'
import { serializeSearchParams, topSelling } from './search'
import { categoryImages } from './tree'

export default function CategoryPage() {
  const { slug = '' } = useParams()
  const w = useWorld()
  const layout = useLayout()
  const cat = w.categories.find((c) => c.slug === slug)
  const images = useMemo(() => categoryImages(w), [w])
  const ids = useMemo(() => new Set(cat ? leavesUnder(w, cat.id) : []), [w, cat])
  const best = useMemo(() => topSelling(w.products, ids, 10), [w, ids])
  const railReady = useLoaded([slug])
  useEffect(() => { if (cat) document.title = `${cat.name} · Market` }, [cat])
  if (!cat) return <NotFound what="danh mục" />

  const trail = ancestry(w, cat.id)
  const kids = cat.level < 3 ? childrenOf(w, cat.id) : []
  const crumbs = layout === 'app' && trail.length > 2 ? [trail[0], null, trail[trail.length - 1]] : trail
  const hasProducts = w.products.some((p) => p.status === 'active' && ids.has(p.categoryId))
  const bestsellingUrl = `?${serializeSearchParams({ sort: 'bestselling' })}`

  return (
    <div>
      <nav aria-label="Đường dẫn" className="mb-2 text-[13px] text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="text-muted no-underline hover:text-ink">Trang chủ</Link></li>
          {crumbs.map((c, i) => (
            <Fragment key={c?.id ?? 'gap'}>
              <li aria-hidden><ChevronRight size={13} /></li>
              <li>{!c ? <span aria-label="Các cấp giữa">…</span> : i === crumbs.length - 1 ? <span aria-current="page" className="text-ink-2">{c.name}</span> : <Link to={`/c/${c.slug}`} className="text-muted no-underline hover:text-ink">{c.name}</Link>}</li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <PageTitle className="mb-5 break-words">{cat.name}</PageTitle>

      {kids.length > 0 && (
        <ul aria-label="Danh mục con" className={cx('mb-8 gap-4', layout === 'app' ? 'no-scrollbar -mx-4 flex overflow-x-auto px-4' : 'grid grid-cols-8')}>
          {kids.map((k) => (
            <li key={k.id} className={layout === 'app' ? 'w-[76px] shrink-0' : 'min-w-0'}>
              <Link to={`/c/${k.slug}`} className="flex flex-col items-center gap-2 text-center no-underline">
                <Img src={images.get(k.id)} alt="" className="size-16 rounded-full lg:size-24" />
                <span className="line-clamp-2 text-[12px] leading-4 lg:text-[14px] lg:leading-5">{k.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!hasProducts ? (
        <>
          <p className="py-6 text-[15px] text-muted">Danh mục này chưa có sản phẩm.</p>
          <TodayPicks />
        </>
      ) : (
        <>
          {cat.level < 3 && best.length > 0 && (
            <section aria-labelledby="best-in-cat" className="mb-10">
              <div className="mb-3 flex items-end justify-between gap-4">
                <h2 id="best-in-cat" className="font-display text-[20px] font-semibold lg:text-[24px]">Bán chạy</h2>
                <ButtonLink to={bestsellingUrl} variant="secondary" size="sm">Xem tất cả</ButtonLink>
              </div>
              {railReady ? <ProductRail products={best} label={`Bán chạy trong ${cat.name}`} /> : <GridSkeleton n={5} />}
            </section>
          )}
          <Results key={cat.id} scope={cat} />
        </>
      )}
    </div>
  )
}

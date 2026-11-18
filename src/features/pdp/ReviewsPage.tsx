// US-PDP-008: /p/:slug/reviews, newest first, filters in the query (star, media, comment, sku, page).
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { delay, productBySlug, skuById, useWorld } from '@/app/store'
import { Button, Chip, EmptyState, PageTitle, Sheet, Skeleton, Stars, useLoaded } from '@/components/ui'
import { variantText } from '@/mock/seed'
import NotFound from '@/features/demo/NotFound'
import { filterReviews, parseReviewParams, reviewSummary } from './pdp'
import { Distribution, ReviewItem } from './Reviews'

const PAGE = 10

export default function ReviewsPage() {
  const { slug = '' } = useParams()
  const w = useWorld()
  const layout = useLayout()
  const [q, setQ] = useSearchParams()
  const [skuSheet, setSkuSheet] = useState(false)
  const [more, setMore] = useState(false)
  const product = productBySlug(w, slug)
  const ready = useLoaded([slug])
  useEffect(() => { if (product) document.title = `Đánh giá ${product.name} | Market` }, [product])
  if (!product) return <NotFound what="sản phẩm" />

  const all = w.reviews.filter((r) => r.productId === product.id)
  const params = parseReviewParams(q)
  const list = filterReviews(all, params)
  const page = Math.max(1, Number(q.get('page')) || 1)
  const shown = list.slice(0, page * PAGE)
  const s = reviewSummary(all)
  const skuIds = [...new Set(all.map((r) => r.skuId))]
  const skuLabel = (id: string) => { const k = skuById(w, id); return (k && variantText(product, k)) || 'Phân loại đã ngừng bán' }

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(q)
    for (const [k, v] of Object.entries(patch)) v == null ? next.delete(k) : next.set(k, v)
    next.delete('page')
    setQ(next, { replace: true })
  }
  const loadMore = async () => {
    setMore(true)
    await delay()
    const next = new URLSearchParams(q); next.set('page', String(page + 1)); setQ(next, { replace: true })
    setMore(false)
  }
  const none = !params.star && !params.media && !params.comment && !params.sku

  return (
    <div className="mx-auto max-w-[760px] pb-16">
      <p className="mb-1 truncate text-[13px] text-muted"><Link to={`/p/${product.slug}`} className="text-ink-2 hover:text-ink">{product.name}</Link></p>
      <PageTitle>Đánh giá</PageTitle>
      {!ready ? (
        <div className="mt-6 space-y-6" aria-busy="true" aria-label="Đang tải">{[0, 1, 2].map((i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>)}</div>
      ) : !s.count ? (
        <EmptyState title="Chưa có đánh giá nào cho sản phẩm này" />
      ) : (
        <>
          <div className="mt-5 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-center">
            <div>
              <p className="font-display text-[36px] leading-none font-semibold lg:text-[40px]">{s.avg.toLocaleString('vi-VN')}<span className="ml-1 font-sans text-[15px] font-normal text-muted">trên 5</span></p>
              <Stars value={s.avg} size={16} count={s.count} className="mt-2" />
            </div>
            <Distribution byStar={s.byStar} count={s.count} />
          </div>

          <div role="group" aria-label="Lọc đánh giá" className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
            <Chip selected={none} onClick={() => setQ(new URLSearchParams(), { replace: true })}>Tất cả</Chip>
            {[5, 4, 3, 2, 1].map((n) => (
              <Chip key={n} selected={params.star === n} onClick={() => set({ star: params.star === n ? null : String(n) })}>{n} Sao ({s.byStar[n - 1]})</Chip>
            ))}
            <Chip selected={!!params.media} onClick={() => set({ media: params.media ? null : '1' })}>Có hình ảnh ({all.filter((r) => r.photos.length).length})</Chip>
            <Chip selected={!!params.comment} onClick={() => set({ comment: params.comment ? null : '1' })}>Có bình luận ({all.filter((r) => r.text.trim()).length})</Chip>
            <Chip selected={!!params.sku} onClick={() => setSkuSheet(true)} aria-haspopup="dialog">
              <span className="max-w-[180px] truncate">{params.sku ? skuLabel(params.sku) : 'Phân loại'}</span><ChevronDown size={14} aria-hidden />
            </Chip>
          </div>

          <div className="mt-2" aria-live="polite">
            {shown.length === 0 ? (
              <EmptyState title="Chưa có đánh giá phù hợp" action={<Button variant="secondary" onClick={() => setQ(new URLSearchParams(), { replace: true })}>Xem tất cả</Button>} />
            ) : shown.map((r) => <ReviewItem key={r.id} review={r} product={product} />)}
          </div>
          {list.length > shown.length && <div className="mt-4 flex justify-center"><Button variant="secondary" loading={more} onClick={loadMore}>Xem thêm đánh giá</Button></div>}

          <Sheet open={skuSheet} onOpenChange={setSkuSheet} title="Phân loại" dialog={layout === 'web'}>
            <ul className="space-y-1">
              <li><button type="button" onClick={() => { set({ sku: null }); setSkuSheet(false) }} className="flex min-h-11 w-full items-center rounded-[10px] px-3 text-left text-[14px] hover:bg-well" aria-pressed={!params.sku}>Tất cả phân loại</button></li>
              {skuIds.map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => { set({ sku: id }); setSkuSheet(false) }} aria-pressed={params.sku === id} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left text-[14px] hover:bg-well aria-pressed:font-semibold">
                    <span className="min-w-0">{skuLabel(id)}</span><span className="tabular text-[12px] text-muted">{all.filter((r) => r.skuId === id).length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Sheet>
        </>
      )}
    </div>
  )
}

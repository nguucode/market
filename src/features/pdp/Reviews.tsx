// US-PDP-008: review summary on the product page and the review list items (reused by the reviews page).
import { ChevronRight, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { skuById, useWorld } from '@/app/store'
import { cx, SectionHead, Stars, RatingText } from '@/components/ui'
import { compactCount } from '@/domain/money'
import type { Product, Review } from '@/domain/types'
import { variantText } from '@/mock/seed'
import { ImageViewer } from './Gallery'
import { dateText, filterReviews, maskName, reviewSummary } from './pdp'

export function ReviewItem({ review: r, product }: { review: Review; product: Product }) {
  const w = useWorld()
  const sku = skuById(w, r.skuId)
  const variant = sku ? variantText(product, sku) : ''
  const [more, setMore] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)
  const long = r.text.length > 320
  return (
    <article className="border-b border-line py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex size-8 items-center justify-center rounded-full bg-well text-[12px] font-semibold text-ink-2" aria-hidden>{r.anonymous ? <UserRound size={16} /> : (r.buyerName[0] ?? '').toUpperCase()}</span>
        <span className="text-[14px] font-semibold">{r.anonymous ? maskName(r.buyerName) : r.buyerName}</span>
        {r.isMine && <span className="rounded-[4px] bg-accent-soft px-1.5 py-px text-[11px] font-semibold text-accent-ink">Đánh giá của bạn</span>}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
        <Stars value={r.rating} size={13} />
        <span>{dateText(r.createdAt)}</span>
        {variant && <><span aria-hidden>·</span><span>Phân loại: {variant}</span></>}
      </div>
      {r.tags.length > 0 && <ul className="mt-2 flex flex-wrap gap-1.5">{r.tags.map((t) => <li key={t} className="rounded-[4px] bg-well px-2 py-0.5 text-[12px] text-ink-2">{t}</li>)}</ul>}
      {r.text && (
        <>
          <p className={cx('mt-2 text-[14px] leading-6 whitespace-pre-line', long && !more && 'line-clamp-6')}>{r.text}</p>
          {long && <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="mt-1 text-[13px] font-semibold text-accent-ink hover:underline">{more ? 'Thu gọn' : 'Xem thêm'}</button>}
        </>
      )}
      {r.photos.length > 0 && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" aria-label="Ảnh đánh giá">
          {r.photos.map((src, i) => (
            <li key={src + i} className="shrink-0">
              <button type="button" onClick={() => setViewer(i)} aria-label={`Xem ảnh đánh giá ${i + 1}`} className="block overflow-hidden rounded-[8px]">
                <img src={src} alt="" loading="lazy" className="size-16 bg-well object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {viewer !== null && <ImageViewer images={r.photos} index={viewer} onIndex={setViewer} open onOpenChange={(o) => !o && setViewer(null)} alt="Ảnh đánh giá" />}
      {r.shopReply && (
        <div className="mt-3 rounded-[var(--radius-control)] bg-ground px-3.5 py-3 text-[13px]">
          <p className="font-semibold">Phản hồi của Shop</p>
          <p className="mt-1 text-ink-2 whitespace-pre-line">{r.shopReply.text}</p>
        </div>
      )}
    </article>
  )
}

export function Distribution({ byStar, count }: { byStar: number[]; count: number }) {
  return (
    <ul className="space-y-1.5" aria-label="Phân bố số sao">
      {[5, 4, 3, 2, 1].map((s) => (
        <li key={s} className="flex items-center gap-2.5 text-[12px]">
          <span className="w-10 shrink-0 text-ink-2">{s} sao</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface" aria-hidden><span className="block h-full rounded-full bg-accent" style={{ width: `${count ? (byStar[s - 1] / count) * 100 : 0}%` }} /></span>
          <span className="tabular w-8 shrink-0 text-right text-muted">{compactCount(byStar[s - 1])}</span>
        </li>
      ))}
    </ul>
  )
}

/** Big accent average beside the accent star bars, on a tinted block (PDP and the reviews page). */
export function RatingOverview({ avg, byStar, count }: { avg: number; byStar: number[]; count: number }) {
  return (
    <div className="grid items-center gap-5 rounded-[var(--radius-control)] bg-well p-4 lg:grid-cols-[200px_minmax(0,360px)] lg:gap-10 lg:px-6">
      <div>
        <p className="tabular font-display text-[36px] leading-none text-accent lg:text-[40px]">{avg.toLocaleString('vi-VN')}<span className="ml-1 font-sans text-[15px] font-normal text-accent-ink">trên 5</span></p>
        <Stars value={avg} size={16} count={count} className="mt-2" />
      </div>
      <Distribution byStar={byStar} count={count} />
    </div>
  )
}

/** Summary on the product page: average, star row, count, distribution, newest reviews. */
export function ReviewsSummary({ product }: { product: Product }) {
  const w = useWorld()
  const layout = useLayout()
  const reviews = w.reviews.filter((r) => r.productId === product.id)
  const s = reviewSummary(reviews)
  const newest = filterReviews(reviews, {}).slice(0, layout === 'app' ? 2 : 3)
  const to = `/p/${product.slug}/reviews`
  if (!s.count)
    return (
      <section aria-labelledby="pdp-reviews">
        <SectionHead id="pdp-reviews" title="Đánh giá sản phẩm" />
        <p className="text-[14px] text-muted">Chưa có đánh giá nào cho sản phẩm này</p>
      </section>
    )
  return (
    <section aria-labelledby="pdp-reviews">
      {layout === 'app' ? (
        <Link to={to} className="mb-1 flex min-h-11 items-center gap-2 no-underline">
          <h2 id="pdp-reviews" className="font-display text-[18px]">Đánh giá sản phẩm</h2>
          <RatingText value={s.avg} count={compactCount(s.count)} className="text-[13px] text-ink-2" />
          <ChevronRight size={18} aria-hidden className="ml-auto text-muted" />
        </Link>
      ) : (
        <>
          <SectionHead id="pdp-reviews" title="Đánh giá sản phẩm" />
          <RatingOverview avg={s.avg} byStar={s.byStar} count={s.count} />
        </>
      )}
      <div>{newest.map((r) => <ReviewItem key={r.id} review={r} product={product} />)}</div>
      <Link to={to} className="mt-2 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-accent-ink no-underline hover:underline">Xem tất cả đánh giá<ChevronRight size={16} aria-hidden /></Link>
    </section>
  )
}

// US-CHK-008: the n orders a checkout created, one per shop.
import { Check, ChevronRight } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { useNow, useWorld } from '@/app/store'
import { ButtonLink, cx, PageTitle, Skeleton, useLoaded, vnd } from '@/components/ui'
import { PAYMENT_LABEL, STATUS_LABEL } from '@/domain/orders'
import { etaText } from '@/domain/shipping'
import NotFound from '@/features/demo/NotFound'
import { resultRedirect } from './checkout'
import { getWallet } from './wallet'

export default function ResultPage() {
  const { paymentId = '' } = useParams()
  const w = useWorld()
  const t = useNow()
  const loaded = useLoaded([paymentId])
  const web = useLayout() === 'web'
  const p = w.payments.find((x) => x.id === paymentId)
  if (!p) return <NotFound />
  const go = resultRedirect(p)
  if (go) return <Navigate to={go} replace />
  const orders = p.orderIds.map((id) => w.orders.find((o) => o.id === id)!).filter(Boolean)
  const total = orders.reduce((a, o) => a + o.total, 0)
  const method = p.method === 'wallet' ? getWallet() : PAYMENT_LABEL[p.method]

  return (
    <div className="mx-auto max-w-[640px] pb-12">
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-jade-soft text-jade-ink" aria-hidden><Check size={26} strokeWidth={2.2} /></span>
        <PageTitle>Đặt hàng thành công</PageTitle>
        <p className="mt-2 text-[15px] text-ink-2">
          {p.method === 'cod' ? <>Bạn sẽ thanh toán <span className="tabular font-semibold text-ink">{vnd(total)}</span> khi nhận hàng</> : <>Đã thanh toán <span className="tabular font-semibold text-ink">{vnd(total)}</span> bằng {method}</>}
        </p>
      </div>
      {!loaded ? (
        <div aria-busy="true" aria-label="Đang tải" className="mt-8 space-y-4">{orders.map((o) => <Skeleton key={o.id} className="h-16" />)}</div>
      ) : (
        <section aria-labelledby="result-orders" className="mt-8">
          <h2 id="result-orders" className="text-[14px] text-ink-2">Đơn của bạn được tách thành {orders.length} đơn hàng theo từng Shop</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {orders.map((o) => {
              const shop = w.shops.find((s) => s.id === o.shopId)!
              const items = o.lines.reduce((a, l) => a + l.qty, 0)
              return (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="flex items-center gap-3 py-3.5 no-underline hover:bg-well/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{shop.name}</p>
                      <p className="tabular text-[12px] text-muted">{o.id} · {items} sản phẩm · {etaText(o.eta, t)}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-ink-2">{STATUS_LABEL[o.status]}</p>
                    </div>
                    <p className="tabular shrink-0 text-[15px] font-semibold whitespace-nowrap">{vnd(o.total)}</p>
                    <ChevronRight size={18} aria-hidden className="shrink-0 text-muted" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <div className={cx('mt-8 flex gap-3', web ? 'justify-center' : 'flex-col')}>
        <ButtonLink to="/orders" size="lg">Xem đơn mua</ButtonLink>
        <ButtonLink to="/" variant="secondary" size="lg">Tiếp tục mua sắm</ButtonLink>
      </div>
    </div>
  )
}

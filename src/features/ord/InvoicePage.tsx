// US-ORD-007 Printable order invoice. Shell: none (sitemap.yaml). Print styles only, no PDF library.
import { Printer } from 'lucide-react'
import { useParams } from 'react-router'
import { useWorld } from '@/app/store'
import { Button, PageTitle, SampleBadge, Skeleton, useLoaded, vnd } from '@/components/ui'
import { PAYMENT_LABEL } from '@/domain/orders'
import NotFound from '@/features/demo/NotFound'
import { dmy, dmyhm, invoiceAvailable, paymentRows } from './logic'

export default function InvoicePage() {
  const { id } = useParams()
  const w = useWorld()
  const ready = useLoaded([id])
  const o = w.orders.find((x) => x.id === id)
  if (!o || !invoiceAvailable(o)) return <main className="px-4 pt-10"><NotFound what="hóa đơn" /></main>
  const shop = w.shops.find((s) => s.id === o.shopId)!
  const { rows } = paymentRows(o)
  const a = o.address
  return (
    <main className="min-h-dvh bg-ground px-4 py-4 print:bg-white print:p-0 lg:py-10">
      <style>{'@page { size: A4 portrait; margin: 14mm; }'}</style>
      <div className="mx-auto mb-4 flex max-w-[794px] flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <SampleBadge className="self-start" />
        <Button onClick={() => window.print()} className="w-full lg:w-auto"><Printer size={16} aria-hidden />In / Lưu PDF</Button>
      </div>
      <article className="mx-auto max-w-[794px] rounded-[var(--radius-card)] bg-surface p-5 text-ink print:max-w-none print:rounded-none print:p-0 lg:p-10">
        <div className="flex items-start justify-between gap-4">
          <PageTitle>Hóa đơn</PageTitle>
          <span className="hidden text-[11px] font-semibold print:inline">Dữ liệu mẫu</span>
        </div>
        {!ready ? (
          <div className="mt-6 space-y-3" aria-busy="true" aria-label="Đang tải hóa đơn"><Skeleton className="h-16 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
              <dt className="text-muted">Mã đơn hàng</dt><dd className="tabular font-medium">{o.id}</dd>
              <dt className="text-muted">Ngày đặt hàng</dt><dd className="tabular">{dmy(o.createdAt)}</dd>
              <dt className="text-muted">Phương thức thanh toán</dt><dd>{PAYMENT_LABEL[o.paymentMethod]}</dd>
            </dl>
            <div className="mt-6 grid gap-6 border-t border-line pt-5 text-[13px] sm:grid-cols-2 print:grid-cols-2">
              <section>
                <h2 className="mb-1.5 font-display text-[16px] font-semibold">Người bán</h2>
                <p className="font-medium">{shop.legalName}</p>
                <p className="text-ink-2">{shop.businessAddress}</p>
                <p className="text-ink-2">Mã số doanh nghiệp: <span className="tabular">{shop.businessCode}</span></p>
              </section>
              <section>
                <h2 className="mb-1.5 font-display text-[16px] font-semibold">Người mua</h2>
                <p className="font-medium">{a.name}</p>
                <p className="text-ink-2">{a.phone}</p>
                <p className="text-ink-2">{[a.detail, a.wardName, a.provinceName].filter(Boolean).join(', ')}</p>
              </section>
            </div>
            <div className="mt-6 overflow-x-auto print:overflow-visible" tabIndex={0} role="region" aria-label="Danh sách sản phẩm trong hóa đơn">
              <table className="w-full min-w-[560px] border-collapse text-[13px] print:min-w-0">
                <thead>
                  <tr className="border-b border-ink text-left">
                    <th scope="col" className="py-2 pr-3 font-semibold">Sản phẩm</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Phân loại</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold whitespace-nowrap">Số lượng</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold whitespace-nowrap">Đơn giá</th>
                    <th scope="col" className="py-2 text-right font-semibold whitespace-nowrap">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {o.lines.map((l) => (
                    <tr key={l.id} className="border-b border-line align-top break-inside-avoid">
                      <td className="py-2 pr-3">{l.name}</td>
                      <td className="py-2 pr-3 text-ink-2">{l.variantText || '—'}</td>
                      <td className="tabular py-2 pr-3 text-right">{l.qty}</td>
                      <td className="tabular py-2 pr-3 text-right whitespace-nowrap">{vnd(l.unitPrice)}</td>
                      <td className="tabular py-2 text-right whitespace-nowrap">{vnd(l.unitPrice * l.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 ml-auto max-w-[420px] space-y-1.5 text-[13px] break-inside-avoid">
              {rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-4"><dt className="text-ink-2">{r.label}</dt><dd className="tabular whitespace-nowrap">{r.minus ? `−${vnd(r.amount)}` : vnd(r.amount)}</dd></div>
              ))}
              <div className="flex justify-between gap-4 border-t border-ink pt-2 text-[15px] font-bold"><dt>Tổng thanh toán</dt><dd className="tabular whitespace-nowrap">{vnd(o.total)}</dd></div>
            </dl>
            <p className="mt-1.5 ml-auto max-w-[420px] text-right text-[12px] text-muted">Giá đã bao gồm VAT</p>
            <p className="mt-8 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
              Chứng từ này do Market tạo từ thông tin đơn hàng, không thay thế hóa đơn giá trị gia tăng của người bán.
            </p>
            <p className="mt-2 hidden text-[11px] text-muted print:block">{location.href} · In lúc {dmyhm(Date.now())}</p>
          </>
        )}
      </article>
    </main>
  )
}

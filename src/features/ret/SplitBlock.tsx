// "Số tiền hoàn" block shared by the return confirm step and the return status page (US-RET-001/-002).
import { MoneyFold, vnd } from '@/components/ui'
import { refundSplit } from '@/domain/orders'
import type { Order } from '@/domain/types'

/** "Số tiền hoàn" from the snapshot: what comes back as cash, as Voucher Market credit, and what does not. */
export function RefundSplitBlock({ o, lineIds, cash, credit }: { o: Order; lineIds: string[]; cash?: number; credit?: number }) {
  const s = refundSplit(o, lineIds)
  const all = o.lines.every((l) => lineIds.includes(l.id))
  const shipPaid = o.shippingFee - o.shippingDiscount
  const muted = (t: string) => <span className="text-muted">{t}</span>
  return (
    <div className="panel p-4 lg:p-5">
      <h3 className="mb-3 font-display text-[16px]">Số tiền hoàn</h3>
      <MoneyFold label="Hoàn tiền về tài khoản" total={cash ?? s.cash} defaultOpen size="md" lines={[
        { label: 'Tiền hàng', amount: s.goods },
        ...(s.shopShare ? [{ label: muted('Voucher của Shop (không hoàn)'), amount: s.shopShare, tone: 'minus' as const }] : []),
        ...(s.platformShare ? [{ label: 'Voucher Market đã dùng', amount: s.platformShare, tone: 'minus' as const }] : []),
        ...(all ? [{ label: 'Phí vận chuyển', amount: s.shipping }] : []),
      ]} footnote={!all && shipPaid > 0 ? `Phí vận chuyển ${vnd(shipPaid)} chỉ được hoàn khi trả toàn bộ đơn.` : undefined} />
      {(credit ?? s.voucherCredit) > 0 && (
        <p className="mt-3 flex justify-between gap-4 border-t border-line pt-3 text-[14px]">
          <span>Hoàn vào Kho voucher: Voucher Market</span><strong className="tabular font-bold whitespace-nowrap text-accent">{vnd(credit ?? s.voucherCredit)}</strong>
        </p>
      )}
    </div>
  )
}

// US-FND-004: reviewer tool, never part of the persona's UI. Every transition the mock store supports.
import { SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { RETURN_LABEL, STATUS_LABEL } from '@/domain/orders'
import { vnd } from '@/domain/money'
import {
  advanceOrder, expirePayment, expireVoucher, failDelivery, finishRefund, jumpClock, now, resetDemo, respondCancel, returnDemo, setSettings,
  startNextFlashSlot, useSettings, useWorld, type ReturnDemo, type Settings,
} from '@/app/store'
import { Button, cx, Sheet, toast } from '@/components/ui'

const HOUR = 3_600_000
const DAY = 24 * HOUR

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-2.5 border-b border-line py-4 last:border-0"><h3 className="text-[13px] font-semibold tracking-[0.01em] text-ink-2">{title}</h3>{children}</section>
}
function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cx('h-8 rounded-full px-3 text-[12px] font-medium ring-1 ring-inset', value === v ? 'bg-ink text-white ring-ink' : 'bg-surface ring-line hover:ring-line-strong')}>{l}</button>
      ))}
    </div>
  )
}

export function DemoControlsPanel({ onDone }: { onDone?: () => void }) {
  const w = useWorld()
  const s = useSettings()
  const { pathname } = useLocation()
  const t = now()
  const said = (m: string) => { toast(m); onDone?.() }
  const set = (p: Partial<Settings>, m: string) => { setSettings(p); toast(m) }

  // Context: the order or return on screen comes first.
  const ctxOrder = pathname.match(/^\/orders\/([^/]+)/)?.[1]
  const ctxReturn = pathname.match(/^\/returns\/([^/]+)/)?.[1]
  const live = w.orders.filter((o) => ['awaiting_payment', 'to_confirm', 'to_ship', 'shipping', 'delivered'].includes(o.status))
  const sorted = [...live].sort((a, b) => (a.id === ctxOrder ? -1 : b.id === ctxOrder ? 1 : b.createdAt - a.createdAt)).slice(0, 8)
  const cancelReqs = w.orders.filter((o) => o.cancelRequest?.status === 'pending')
  const refunds = w.orders.filter((o) => o.refund?.status === 'processing')
  const openReturns = w.returns.filter((r) => !['refunded', 'rejected'].includes(r.status)).sort((a) => (a.id === ctxReturn ? -1 : 1))
  const shopName = (id: string) => w.shops.find((x) => x.id === id)?.name ?? ''
  const nextFlash = w.flashSlots.find((x) => x.startsAt > t)

  return (
    <div className="text-[13px]">
      <Group title="Đơn hàng">
        {sorted.length === 0 && <p className="text-muted">Không có đơn đang xử lý.</p>}
        <ul className="space-y-2">
          {sorted.map((o) => (
            <li key={o.id} className={cx('rounded-[10px] p-2.5 ring-1 ring-inset', o.id === ctxOrder ? 'bg-accent-soft/50 ring-accent' : 'ring-line')}>
              <p className="flex justify-between gap-2"><span className="truncate font-medium">{shopName(o.shopId)}</span><span className="shrink-0 text-muted">{STATUS_LABEL[o.status]}</span></p>
              <p className="tabular text-[12px] text-muted">{o.id} · {vnd(o.total)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {o.status === 'awaiting_payment'
                  ? <Button size="sm" variant="secondary" onClick={() => { expirePayment(o.paymentId); said('Đã cho hết hạn thanh toán') }}>Hết hạn thanh toán</Button>
                  : <Button size="sm" variant="secondary" onClick={() => { advanceOrder(o.id); said('Đã chuyển trạng thái đơn') }}>{{ to_confirm: 'Shop xác nhận', to_ship: 'Giao cho vận chuyển', shipping: 'Giao thành công', delivered: 'Hoàn thành' }[o.status as 'to_confirm']}</Button>}
                {o.status === 'shipping' && <Button size="sm" variant="ghost" onClick={() => { failDelivery(o.id); said('Đã đánh dấu giao không thành công') }}>Giao thất bại</Button>}
              </div>
            </li>
          ))}
        </ul>
        {cancelReqs.map((o) => (
          <div key={o.id} className="rounded-[10px] p-2.5 ring-1 ring-inset ring-line">
            <p>Yêu cầu hủy · <span className="tabular">{o.id}</span></p>
            <div className="mt-2 flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => { respondCancel(o.id, true); said('Shop đã chấp nhận hủy') }}>Shop chấp nhận</Button>
              <Button size="sm" variant="ghost" onClick={() => { respondCancel(o.id, false); said('Shop đã từ chối hủy') }}>Shop từ chối</Button>
            </div>
          </div>
        ))}
        {refunds.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-2 rounded-[10px] p-2.5 ring-1 ring-inset ring-line">
            <span>Hoàn tiền <span className="tabular">{vnd(o.refund!.amount)}</span></span>
            <Button size="sm" variant="secondary" onClick={() => { finishRefund(o.id); said('Đã hoàn tiền xong') }}>Hoàn tiền xong</Button>
          </div>
        ))}
      </Group>

      <Group title="Trả hàng/Hoàn tiền">
        {openReturns.length === 0 && <p className="text-muted">Không có yêu cầu đang mở.</p>}
        {openReturns.map((r) => {
          const acts: [ReturnDemo, string][] =
            r.status === 'submitted' || r.status === 'under_review' ? [['approve_refund', 'Hoàn tiền ngay'], ['approve_return', 'Chấp nhận trả hàng'], ['need_evidence', 'Cần bằng chứng'], ['reject', 'Từ chối']]
              : r.status === 'returning' || r.status === 'awaiting_return_shipment' ? [['received', 'Kho nhận hàng trả']]
                : r.status === 'inspecting' ? [['inspected', 'Kiểm tra đạt, hoàn tiền'], ['reject', 'Kiểm tra không đạt']]
                  : []
          return (
            <div key={r.id} className={cx('rounded-[10px] p-2.5 ring-1 ring-inset', r.id === ctxReturn ? 'bg-accent-soft/50 ring-accent' : 'ring-line')}>
              <p className="flex justify-between"><span className="tabular">{r.orderId}</span><span className="text-muted">{RETURN_LABEL[r.status]}</span></p>
              <div className="mt-2 flex flex-wrap gap-1.5">{acts.map(([a, l]) => <Button key={a} size="sm" variant="secondary" onClick={() => { returnDemo(r.id, a); said(l) }}>{l}</Button>)}</div>
            </div>
          )
        })}
      </Group>

      <Group title="Thanh toán online tiếp theo">
        <Seg label="Kết quả thanh toán" value={s.nextPayment} options={[['success', 'Thành công'], ['failure', 'Thất bại'], ['timeout', 'Hết thời gian chờ']]} onChange={(v) => set({ nextPayment: v }, 'Đã đặt kết quả thanh toán tiếp theo')} />
      </Group>
      <Group title="Đặt hàng tiếp theo">
        <Seg label="Kịch bản đặt hàng" value={s.nextPlaceOrder} options={[['normal', 'Bình thường'], ['price_changed', 'Giá thay đổi khi đặt hàng'], ['out_of_stock', 'Hết hàng khi đặt hàng']]} onChange={(v) => set({ nextPlaceOrder: v }, 'Đã đặt kịch bản cho lần đặt hàng tiếp theo')} />
      </Group>
      <Group title="Thời gian">
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => { jumpClock(HOUR); said('Đã tua 1 giờ') }}>+1 giờ</Button>
          <Button size="sm" variant="secondary" onClick={() => { jumpClock(DAY); said('Đã tua 1 ngày') }}>+1 ngày</Button>
          <Button size="sm" variant="secondary" onClick={() => { jumpClock(16 * DAY); said('Đã tua 16 ngày') }}>+16 ngày</Button>
          {nextFlash && <Button size="sm" variant="secondary" onClick={() => { startNextFlashSlot(); said('Đã bắt đầu khung flash sale tiếp theo') }}>Khung flash sale tiếp theo</Button>}
          <Button size="sm" variant="ghost" onClick={() => { expireVoucher('mk2gio'); said('Voucher 2 giờ đã hết hạn') }}>Hết hạn voucher 2 giờ</Button>
        </div>
        {s.clockOffsetMs > 0 && <p className="text-muted">Đồng hồ demo đang lệch {Math.round(s.clockOffsetMs / HOUR)} giờ.</p>}
      </Group>
      <Group title="Mạng">
        <Seg label="Độ trễ" value={s.latency} options={[['normal', 'Bình thường'], ['slow', 'Chậm'], ['none', 'Tức thì']]} onChange={(v) => set({ latency: v }, 'Đã đổi độ trễ')} />
      </Group>
      <div className="pt-4"><Button variant="secondary" full onClick={() => { resetDemo(); said('Đã đặt lại dữ liệu mẫu') }}>Đặt lại dữ liệu mẫu</Button></div>
    </div>
  )
}

export function DemoControlsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return <Sheet open={open} onOpenChange={onOpenChange} title="Demo controls" description="Công cụ cho người xem demo, không thuộc giao diện của người mua."><DemoControlsPanel /></Sheet>
}
export function DemoControlsButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-8 shrink-0 items-center gap-1 rounded-[6px] px-2 whitespace-nowrap hover:text-accent-ink"><SlidersHorizontal size={13} aria-hidden />Demo controls</button>
      <DemoControlsSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

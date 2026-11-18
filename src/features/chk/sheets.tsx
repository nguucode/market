// Checkout overlays (sitemap.yaml): address-sheet, shipping-sheet, payment-sheet, voucher-sheet, and the place-order diff.
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { MAX_ADDRESSES, saveVoucher, savedUse, useWorld, type CheckoutQuote } from '@/app/store'
import { Button, cx, Radio, Sheet, vnd } from '@/components/ui'
import { PAYMENT_LABEL } from '@/domain/orders'
import { ineligibility, type VoucherContext } from '@/domain/pricing'
import { etaText, OPTION_LABEL } from '@/domain/shipping'
import type { Address, PaymentMethod, ShippingOption, Voucher } from '@/domain/types'
import { addressLine, LABEL_TEXT, sortAddresses } from '@/features/acc/account'
import { NoVoucherOption, VoucherOption } from '@/features/crt/VoucherOption'
import { sheetReason } from '@/features/crt/vouchers'
import { METHODS, WALLETS, type Row } from './checkout'
import type { Wallet } from './wallet'

/* ── Address ──────────────────────────────────────────────────────── */

export function AddressSheet({ current, onClose, onPick, onEdit, onAdd }: {
  current?: string; onClose: () => void; onPick: (id: string) => void; onEdit: (a: Address) => void; onAdd: () => void
}) {
  const w = useWorld()
  const [picked, setPicked] = useState(current)
  const list = sortAddresses(w.addresses)
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Địa chỉ nhận hàng"
      footer={<div className="flex gap-2">
        <Button variant="secondary" size="lg" disabled={list.length >= MAX_ADDRESSES} onClick={onAdd}>Thêm địa chỉ mới</Button>
        <Button size="lg" full disabled={!picked} onClick={() => picked && onPick(picked)}>Xác nhận</Button>
      </div>}>
      <fieldset className="space-y-2.5">
        <legend className="sr-only">Chọn địa chỉ nhận hàng</legend>
        {list.map((a) => (
          <div key={a.id} className="relative">
            <Radio name="checkout-address" checked={picked === a.id} onChange={() => setPicked(a.id)} className="pr-16">
              <span className="flex min-w-0 items-center gap-1.5 text-[14px]"><span className="truncate font-semibold">{a.name}</span><span className="text-muted">|</span><span className="tabular shrink-0">{a.phone}</span></span>
              <span className="mt-0.5 line-clamp-2 block text-[13px] text-ink-2">{addressLine(a)}</span>
              <span className="mt-1 flex gap-1.5">
                {a.isDefault && <Tag>Mặc định</Tag>}
                <Tag>{LABEL_TEXT[a.label]}</Tag>
              </span>
            </Radio>
            <button type="button" onClick={() => onEdit(a)} className="absolute top-1 right-1 min-h-11 px-3 text-[13px] font-semibold text-jade-ink hover:underline" aria-label={`Sửa địa chỉ ${addressLine(a)}`}>Sửa</button>
          </div>
        ))}
      </fieldset>
      {list.length >= MAX_ADDRESSES && <p className="mt-3 text-[12px] text-muted">Bạn đã có tối đa {MAX_ADDRESSES} địa chỉ</p>}
    </Sheet>
  )
}
export const Tag = ({ children }: { children: React.ReactNode }) => <span className="rounded-full bg-well px-2 py-0.5 text-[11px] font-semibold text-ink-2">{children}</span>

/* ── Shipping ─────────────────────────────────────────────────────── */

export function ShippingSheet({ shop, now, onClose, onPick }: { shop: CheckoutQuote['shops'][number]; now: number; onClose: () => void; onPick: (o: ShippingOption) => void }) {
  const [picked, setPicked] = useState<ShippingOption>(shop.option)
  const opts: ShippingOption[] = ['express', 'fast', 'economy']
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Phương thức vận chuyển" description={shop.shop.name}
      footer={<Button full size="lg" onClick={() => onPick(picked)}>Xác nhận</Button>}>
      <fieldset className="space-y-2.5">
        <legend className="sr-only">Chọn phương thức vận chuyển</legend>
        {opts.map((o) => {
          const q = shop.quotes.find((x) => x.option === o)
          return (
            <Radio key={o} name="shipping-option" checked={picked === o} disabled={!q} onChange={() => setPicked(o)}>
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-semibold">{OPTION_LABEL[o]}</span>
                {q && <span className="tabular text-[14px] font-semibold">{vnd(q.fee)}</span>}
              </span>
              {q ? <span className="block text-[12px] text-muted"><span className="truncate">{q.carrier}</span> · {etaText(q.eta, now)}</span>
                : <span className="block text-[12px] text-ink-2">Chỉ áp dụng khi Shop và địa chỉ nhận cùng tỉnh</span>}
            </Radio>
          )
        })}
      </fieldset>
    </Sheet>
  )
}

/* ── Payment ──────────────────────────────────────────────────────── */

export function PaymentSheet({ method, wallet, cod, hints, onClose, onPick }: {
  method: PaymentMethod; wallet: Wallet; cod: { ok: boolean; reason?: string }; hints: Partial<Record<PaymentMethod, string>>
  onClose: () => void; onPick: (m: PaymentMethod, wallet: Wallet) => void
}) {
  const [m, setM] = useState(method)
  const [wl, setWl] = useState(wallet)
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Phương thức thanh toán"
      footer={<Button full size="lg" onClick={() => onPick(m, wl)}>Xác nhận</Button>}>
      <fieldset className="space-y-2.5">
        <legend className="sr-only">Chọn phương thức thanh toán</legend>
        {METHODS.map((x) => {
          const off = x === 'cod' && !cod.ok
          return (
            <Radio key={x} name="payment-method" checked={m === x} disabled={off} onChange={() => setM(x)}>
              <span className="block text-[14px] font-semibold">{PAYMENT_LABEL[x]}</span>
              {off && <span className="mt-0.5 block text-[12px] text-ink-2">{cod.reason}</span>}
              {hints[x] && <span className="mt-0.5 block text-[12px] font-medium text-jade-ink">{hints[x]}</span>}
              {x === 'wallet' && m === 'wallet' && (
                <span role="radiogroup" aria-label="Chọn ví" className="mt-2 flex gap-2">
                  {WALLETS.map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={wl === n} onClick={(e) => { e.preventDefault(); setWl(n) }}
                      className={cx('min-h-11 rounded-full px-4 text-[13px] font-medium ring-1 ring-inset', wl === n ? 'bg-surface text-jade-ink ring-jade' : 'bg-surface ring-line')}>{n}</button>
                  ))}
                </span>
              )}
            </Radio>
          )
        })}
      </fieldset>
    </Sheet>
  )
}

/* ── Vouchers ─────────────────────────────────────────────────────── */

export type VoucherPick = { shop: Record<string, string | null>; platform: string | null; shipping: string | null }

export function VoucherSheet({ q, ctx, onClose, onApply }: { q: CheckoutQuote; ctx: VoucherContext; onClose: () => void; onApply: (p: VoucherPick) => void }) {
  const w = useWorld()
  const initial = (): VoucherPick => ({
    shop: Object.fromEntries(q.pricing.shops.map((r) => [r.shopId, r.shopVoucher?.id ?? null])),
    platform: q.pricing.platformVoucher?.id ?? null,
    shipping: q.pricing.shippingVoucher?.id ?? null,
  })
  const [p, setP] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const used = (v: Voucher) => savedUse(w, v.id)
  const why = (v: Voucher, base: number) => ineligibility(v, base, { ...ctx, usedByBuyer: used(v) })
  const base = q.pricing.shops.reduce((a, s) => a + s.net, 0)
  const saved = new Set(w.savedVouchers.map((s) => s.voucherId))
  const claimable = (scope: 'platform' | 'shipping') => w.vouchers.filter((v) => v.scope === scope && !v.credit && !saved.has(v.id) && v.endsAt > ctx.now && v.usedCount < v.totalQuota)
  const save = async (id: string) => {
    setSaving(id); setSaveErr(null)
    try { if (!(await saveVoucher(id))) setSaveErr(id) } catch { setSaveErr(id) } finally { setSaving(null) }
  }

  const section = (title: string, name: string, list: Voucher[], extra: Voucher[], value: string | null, set: (id: string | null) => void, baseOf: (v: Voucher) => number) => {
    const rows = list.map((v) => ({ v, r: why(v, baseOf(v)) })).sort((a, b) => Number(!!a.r) - Number(!!b.r))
    return (
      <fieldset className="space-y-2.5">
        <legend className="sticky top-0 z-10 -mx-5 w-[calc(100%+40px)] bg-surface px-5 py-2 text-[14px] font-semibold">{title}</legend>
        {rows.map(({ v, r }) => <VoucherOption key={v.id} v={v} name={name} checked={value === v.id} onPick={() => set(v.id)} now={ctx.now} reason={r ? sheetReason(r) : undefined} />)}
        {extra.map((v) => (
          <VoucherOption key={v.id} v={v} name={name} checked={false} onPick={() => {}} now={ctx.now} disabled
            extra={<span className="mt-1.5 flex items-center gap-2">
              <Button size="sm" variant="secondary" disabled={saving === v.id} onClick={(e) => { e.preventDefault(); save(v.id) }}>{saving === v.id && <Loader2 size={14} className="animate-spin" aria-hidden />}Lưu</Button>
              {saveErr === v.id && <span role="alert" className="text-[12px] text-ink">Không lưu được voucher. Thử lại.</span>}
            </span>} />
        ))}
        {rows.length > 0 && <NoVoucherOption name={name} checked={value === null} onPick={() => set(null)} />}
      </fieldset>
    )
  }
  const noneSaved = !q.available.platform.length && !q.available.shipping.length
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Chọn voucher"
      footer={<Button full size="lg" onClick={() => onApply(p)}>Đồng ý</Button>}>
      <div className="space-y-6">
        {q.shops.filter((s) => s.shopVouchers.length).map((s, i) => {
          const goods = q.pricing.shops[q.shops.indexOf(s)].goods
          return <div key={s.shop.id}>{section(`Voucher của Shop · ${s.shop.name}`, `v-shop-${i}`, s.shopVouchers, [], p.shop[s.shop.id] ?? null, (id) => setP((x) => ({ ...x, shop: { ...x.shop, [s.shop.id]: id } })), () => goods)}</div>
        })}
        {noneSaved && (
          <p className="text-[14px] text-ink-2">Bạn chưa lưu voucher nào. <Link to="/vouchers" className="font-semibold text-jade-ink">Đến Kho voucher</Link></p>
        )}
        {section('Voucher Market', 'v-platform', q.available.platform, claimable('platform'), p.platform, (id) => setP((x) => ({ ...x, platform: id })), () => base)}
        {section('Voucher miễn phí vận chuyển', 'v-shipping', q.available.shipping, claimable('shipping'), p.shipping, (id) => setP((x) => ({ ...x, shipping: id })), () => base)}
      </div>
    </Sheet>
  )
}

/* ── Place-order diff (US-CHK-006) ────────────────────────────────── */

export function DiffDialog({ rows, empty, onClose, onCart }: { rows: Row[] | null; empty: boolean; onClose: () => void; onCart: () => void }) {
  return (
    <Sheet open={!!rows} onOpenChange={(o) => !o && onClose()} title="Đơn hàng có thay đổi" dialog wide
      footer={empty ? <Button full size="lg" onClick={onCart}>Về giỏ hàng</Button> : <Button full size="lg" onClick={onClose}>Xem lại đơn hàng</Button>}>
      <ul className="divide-y divide-line">
        {rows?.map((r, i) => (
          <li key={i} className={cx('flex items-start justify-between gap-3 py-2.5', r.total ? 'text-[18px] font-bold' : 'text-[14px]')}>
            <span className="min-w-0">{r.text}</span>
            {r.removed && <span className="shrink-0 rounded-full bg-well px-2 py-0.5 text-[11px] font-semibold text-ink-2">Đã bỏ</span>}
          </li>
        ))}
      </ul>
      {empty && <p className="mt-3 text-[14px] font-semibold">Không còn sản phẩm nào để đặt</p>}
    </Sheet>
  )
}

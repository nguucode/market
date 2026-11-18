// US-CHK-001…006: one-page checkout (rules.md#checkout-disclosures), address, shipping per shop, payment, vouchers, place order.
import { ChevronRight, CreditCard, MapPin, Ticket, Truck } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import {
  getState, now as storeNow, placeOrder, quoteCheckout, savedUse, setSession, updateCheckout, useNow, useSession, useWorld, type CheckoutDraft, type CheckoutQuote,
} from '@/app/store'
import { Button, cx, Img, MoneyFold, PageTitle, Skeleton, toast, useLoaded, vnd } from '@/components/ui'
import { signedVnd } from '@/domain/money'
import { PAYMENT_LABEL, PAYMENT_MINUTES } from '@/domain/orders'
import { ineligibility, voucherLabel } from '@/domain/pricing'
import { etaText, OPTION_LABEL } from '@/domain/shipping'
import type { Address, PaymentMethod, Voucher } from '@/domain/types'
import { addressLine, LABEL_TEXT } from '@/features/acc/account'
import { AddressFormSheet } from '@/features/acc/AddressForm'
import { useDropNotes } from '@/features/crt/vouchers'
import { codState, priceRows, reconcileLines, totalRow, voucherRows, type Row } from './checkout'
import { AddressSheet, DiffDialog, PaymentSheet, ShippingSheet, Tag, VoucherSheet, type VoucherPick } from './sheets'
import { getWallet, setWallet, type Wallet } from './wallet'

type Overlay = { kind: 'address' } | { kind: 'form'; address?: Address; fromSheet: boolean } | { kind: 'shipping'; shopId: string } | { kind: 'payment' } | { kind: 'voucher' } | null

export default function CheckoutPage() {
  const d = useSession((s) => s.checkout)
  const placed = useRef(false)
  if (placed.current) return null
  if (!d || !d.lines.length) return <Navigate to="/cart" replace />
  return <Checkout d={d} onPlaced={() => { placed.current = true }} />
}

function Checkout({ d, onPlaced }: { d: CheckoutDraft; onPlaced: () => void }) {
  const loaded = useLoaded()
  const layout = useLayout()
  const w = useWorld()
  const t = useNow()
  const nav = useNavigate()
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [wallet, setWalletState] = useState<Wallet>(getWallet)
  const [placing, setPlacing] = useState(false)
  const [diff, setDiff] = useState<{ rows: Row[]; empty: boolean } | null>(null)
  const busy = useRef(false)

  const q = quoteCheckout(w, d, t)
  const ctx = { now: t, paymentMethod: d.payment }
  const used = (v: Voucher) => savedUse(w, v.id)
  const base = q.pricing.shops.reduce((a, s) => a + s.net, 0)
  const cod = codState(q.shops.map((s, i) => ({ name: s.shop.name, codEnabled: s.shop.codEnabled, total: q.pricing.shops[i].total })))

  // Vouchers that stop holding get an inline note in their own block (rules.md#voucher-math item 6).
  const notes = useDropNotes(
    { ...Object.fromEntries(q.pricing.shops.map((r) => [`shop:${r.shopId}`, r.shopVoucher])), platform: q.pricing.platformVoucher, shipping: q.pricing.shippingVoucher },
    (slot, v) => ineligibility(v, slot.startsWith('shop:') ? q.pricing.shops.find((r) => `shop:${r.shopId}` === slot)?.goods ?? 0 : base, { ...ctx, usedByBuyer: used(v) }),
  )
  // An explicitly chosen voucher that dropped goes back to auto, so "Đặt hàng" does not trip on it.
  const droppedKey = q.pricing.dropped.map((x) => x.voucher.id).join()
  useEffect(() => {
    if (!droppedKey) return
    updateCheckout((dd) => {
      for (const { voucher: v } of q.pricing.dropped) {
        if (v.scope === 'shop' && dd.shopVoucher[v.shopId!] === v.id) delete dd.shopVoucher[v.shopId!]
        if (v.scope === 'platform' && dd.platformVoucher === v.id) dd.platformVoucher = undefined
        if (v.scope === 'shipping' && dd.shippingVoucher === v.id) dd.shippingVoucher = undefined
      }
    })
  }, [droppedKey]) // eslint-disable-line react-hooks/exhaustive-deps
  // COD off for the session → default becomes VietQR (US-CHK-004).
  useEffect(() => { if (d.payment === 'cod' && !cod.ok) updateCheckout((dd) => { dd.payment = 'vietqr' }) }, [d.payment, cod.ok])

  const online = d.payment !== 'cod'
  const methodText = d.payment === 'wallet' ? `${PAYMENT_LABEL.wallet} · ${wallet}` : PAYMENT_LABEL[d.payment]
  const hints: Partial<Record<PaymentMethod, string>> = {}
  for (const v of w.vouchers) {
    if (v.scope !== 'platform' || !v.paymentMethods || !w.savedVouchers.some((s) => s.voucherId === v.id)) continue
    for (const m of v.paymentMethods) if (m !== d.payment && !ineligibility(v, base, { now: t, paymentMethod: m, usedByBuyer: used(v) })) hints[m] = `Dùng được ${voucherLabel(v)}`
  }

  const place = async () => {
    if (busy.current || !q.address) return
    busy.current = true; setPlacing(true)
    const before = q
    try {
      const r = await placeOrder(d)
      if (r.ok) {
        onPlaced()
        nav(r.method === 'cod' ? `/checkout/result/${r.paymentId}` : `/checkout/pay/${r.paymentId}`, { replace: true })
        setSession((s) => { delete s.checkout })
        return
      }
      const w2 = getState().world, t2 = storeNow()
      const rec = reconcileLines(d.lines, (skuId) => {
        const k = w2.skus.find((x) => x.id === skuId)!, p = w2.products.find((x) => x.id === k.productId)!
        return { name: p.name, stock: k.stock, active: p.status === 'active' }
      })
      updateCheckout((dd) => { dd.lines = rec.lines })
      const rows: Row[] = [...rec.rows]
      if (rec.lines.length) {
        const after = quoteCheckout(w2, { ...d, lines: rec.lines }, t2)
        const lines = (x: CheckoutQuote) => x.shops.flatMap((s) => s.lines.map((l) => ({ skuId: l.skuId, name: l.product.name, unit: l.unit })))
        const applied = (x: CheckoutQuote) => [...x.pricing.shops.map((s) => s.shopVoucher), x.pricing.platformVoucher, x.pricing.shippingVoucher].filter(Boolean) as Voucher[]
        rows.push(...priceRows(lines(before), lines(after)))
        rows.push(...voucherRows(applied(before), applied(after), (v) => ineligibility(v, v.scope === 'shop' ? after.pricing.shops.find((s) => s.shopId === v.shopId)?.goods ?? 0 : after.pricing.shops.reduce((a, s) => a + s.net, 0), { now: t2, paymentMethod: d.payment })))
        rows.push(...totalRow(before.pricing.total, after.pricing.total))
      }
      if (!rows.length) rows.push(...r.changes.map((c) => ({ text: `${c.name}: ${c.text}` })))
      setDiff({ rows, empty: !rec.lines.length })
    } catch {
      toast('Không đặt được hàng. Vui lòng thử lại.', { tone: 'error' })
    } finally {
      busy.current = false; setPlacing(false)
    }
  }

  const applyVouchers = (p: VoucherPick) => {
    updateCheckout((dd) => { dd.shopVoucher = { ...dd.shopVoucher, ...p.shop }; dd.platformVoucher = p.platform; dd.shippingVoucher = p.shipping })
    setOverlay(null)
  }
  const pickPayment = (m: PaymentMethod, wl: Wallet) => {
    updateCheckout((dd) => { dd.payment = m })
    setWallet(wl); setWalletState(wl)
    setOverlay(null)
  }

  const web = layout === 'web'
  const vLines = [
    { label: 'Tổng tiền hàng', amount: q.pricing.goods },
    { label: 'Tổng phí vận chuyển', amount: q.pricing.shippingFee },
    ...q.pricing.shops.filter((r) => r.shopVoucher).map((r) => ({ label: `Voucher của Shop · ${q.shops.find((s) => s.shop.id === r.shopId)!.shop.name}: ${voucherLabel(r.shopVoucher!)}`, amount: r.shopDiscount, tone: 'minus' as const })),
    ...(q.pricing.platformVoucher ? [{ label: `Voucher Market: ${voucherLabel(q.pricing.platformVoucher)}`, amount: q.pricing.platformDiscount, tone: 'minus' as const }] : []),
    ...(q.pricing.shippingVoucher ? [{ label: `Voucher miễn phí vận chuyển: ${voucherLabel(q.pricing.shippingVoucher)}`, amount: q.pricing.shippingDiscount, tone: 'minus' as const }] : []),
  ]
  const summary = (
    <section aria-labelledby="chk-detail" className={cx(!web && 'bg-surface -mx-4 px-4 py-4')}>
      <h2 id="chk-detail" className="mb-3 text-[16px] font-semibold">Chi tiết thanh toán</h2>
      <MoneyFold defaultOpen total={q.pricing.total} lines={vLines} split={q.shops.map((s, i) => ({ name: s.shop.name, amount: q.pricing.shops[i].total }))} />
      <p className="mt-1.5 text-right text-[12px] text-muted">Giá đã bao gồm VAT</p>
    </section>
  )
  const consent = (
    <p className="text-[12px] text-muted">Nhấn Đặt hàng đồng nghĩa với việc bạn đồng ý với <Link to="/policies/dieu-khoan" className="font-medium text-ink-2 underline underline-offset-2">Điều khoản của Market</Link></p>
  )
  const onlineNote = online && <p className="text-[12px] text-ink-2">Bạn có {PAYMENT_MINUTES} phút để hoàn tất thanh toán sau khi đặt hàng</p>
  const noAddr = !q.address && <p className="text-[12px] text-ink-2" role="status">Vui lòng thêm địa chỉ nhận hàng</p>
  const placeBtn = (
    <Button size="lg" full={web} disabled={!loaded || !q.address} loading={placing} onClick={place} className={cx(!web && 'shrink-0')}>
      {placing ? 'Đang đặt hàng…' : 'Đặt hàng'}
    </Button>
  )

  if (!loaded) return <><PageTitle className={web ? 'mb-5' : 'sr-only'}>Thanh toán</PageTitle><CheckoutSkeleton web={web} /></>

  return (
    <div inert={placing || undefined} className={cx(!web && 'pb-[calc(140px+env(safe-area-inset-bottom))]')}>
      <PageTitle className={web ? 'mb-5' : 'sr-only'}>Thanh toán</PageTitle>
      <div className={cx(web && 'grid grid-cols-[minmax(0,1fr)_380px] items-start gap-10 pb-16')}>
        <div className={cx('min-w-0', web ? 'divide-y divide-line border-t border-line' : 'space-y-2')}>
          {/* Address (US-CHK-002) */}
          <Block web={web}>
            {q.address ? (
              <ChangeRow icon={<MapPin size={18} aria-hidden />} title="Địa chỉ nhận hàng" onClick={() => setOverlay({ kind: 'address' })} action="Thay đổi" web={web}>
                <span className="flex min-w-0 items-center gap-1.5 text-[14px]"><span className="truncate font-semibold">{q.address.name}</span><span className="text-muted">|</span><span className="tabular shrink-0">{q.address.phone}</span></span>
                <span className="mt-0.5 line-clamp-3 block text-[13px] text-ink-2">{addressLine(q.address)}</span>
                <span className="mt-1 flex gap-1.5">{q.address.isDefault && <Tag>Mặc định</Tag>}<Tag>{LABEL_TEXT[q.address.label]}</Tag></span>
              </ChangeRow>
            ) : (
              <ChangeRow icon={<MapPin size={18} aria-hidden />} title="Thêm địa chỉ nhận hàng" onClick={() => setOverlay({ kind: 'form', fromSheet: false })} web={web} />
            )}
          </Block>

          {/* One block per shop (US-CHK-001/003) */}
          {q.shops.map((s, i) => {
            const r = q.pricing.shops[i]
            const fellBack = d.shipping[s.shop.id] === 'express' && s.option !== 'express'
            const count = s.lines.length
            return (
              <Block key={s.shop.id} web={web} label={s.shop.name}>
                <h2 className="truncate text-[16px] font-semibold">{s.shop.name}</h2>
                {!s.shop.codEnabled && <p className="text-[12px] text-muted">Shop không hỗ trợ Thanh toán khi nhận hàng</p>}
                <ul className="mt-2 divide-y divide-line/70">
                  {s.lines.map((l) => (
                    <li key={l.skuId} className="flex gap-3 py-2.5">
                      <Img src={l.sku.image ?? l.product.images[0]} alt="" className="aspect-[4/5] w-14 shrink-0 rounded-[var(--radius-media)] lg:w-16" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[14px] leading-5">{l.product.name}</p>
                        {l.variant && <p className="truncate text-[12px] text-muted">Phân loại: {l.variant}</p>}
                        <p className="mt-0.5 flex items-baseline gap-2 text-[13px]">
                          <span className={cx('tabular', l.before && l.before > l.unit ? 'text-jade' : 'text-ink-2')}>{vnd(l.unit)}</span>
                          {l.before && l.before > l.unit && <s className="tabular text-[12px] text-muted">{vnd(l.before)}</s>}
                          <span className="tabular text-muted">x{l.qty}</span>
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-[14px] font-semibold whitespace-nowrap">{vnd(l.amount)}</p>
                    </li>
                  ))}
                </ul>
                {r.shopVoucher && (
                  <p className="flex justify-between gap-3 py-1.5 text-[13px]"><span className="min-w-0 text-ink-2">Voucher của Shop: {voucherLabel(r.shopVoucher)}</span><span className="tabular shrink-0 text-jade-ink">{signedVnd(-r.shopDiscount)}</span></p>
                )}
                {notes[`shop:${s.shop.id}`] && <p className="py-1 text-[12px] text-ink-2" role="status">{notes[`shop:${s.shop.id}`]}</p>}
                {r.platformShare > 0 && (
                  <p className="flex justify-between gap-3 py-1.5 text-[13px]"><span className="text-ink-2">Voucher Market</span><span className="tabular text-jade-ink">{signedVnd(-r.platformShare)}</span></p>
                )}
                <ChangeRow icon={<Truck size={18} aria-hidden />} title="Phương thức vận chuyển" onClick={() => setOverlay({ kind: 'shipping', shopId: s.shop.id })} web={web}
                  aside={<span className="tabular text-right text-[14px]">
                    {r.shippingDiscount > 0 && <s className="mr-1.5 text-[12px] text-muted">{vnd(r.shippingFee)}</s>}
                    <span className={cx('font-semibold', r.shippingDiscount > 0 && 'text-jade')}>{vnd(r.shippingFee - r.shippingDiscount)}</span>
                  </span>}>
                  <span className="block truncate text-[14px]">{OPTION_LABEL[s.option]} · {s.quote.carrier}</span>
                  <span className="block text-[12px] text-muted">{etaText(s.quote.eta, t)}</span>
                </ChangeRow>
                {fellBack && <p className="pb-1 text-[12px] text-ink-2" role="status">Hỏa tốc chỉ áp dụng khi Shop và địa chỉ nhận cùng tỉnh. Đã chuyển sang Nhanh.</p>}
                <MessageField shopId={s.shop.id} value={d.messages[s.shop.id] ?? ''} />
                <p className="mt-2 flex justify-between gap-3 border-t border-line pt-2.5 text-[14px]">
                  <span>Tổng số tiền ({count} sản phẩm):</span><span className="tabular font-semibold">{vnd(r.total)}</span>
                </p>
              </Block>
            )
          })}

          {/* Vouchers (US-CHK-005) */}
          <Block web={web}>
            <ChangeRow icon={<Ticket size={18} aria-hidden className="text-jade" />} title="Voucher Market" onClick={() => setOverlay({ kind: 'voucher' })} web={web}>
              {q.pricing.platformVoucher || q.pricing.shippingVoucher ? (
                <span className="block space-y-0.5 text-[13px]">
                  {q.pricing.platformVoucher && <span className="block font-medium text-jade-ink">{voucherLabel(q.pricing.platformVoucher)}</span>}
                  {q.pricing.shippingVoucher && <span className="block font-medium text-jade-ink">{voucherLabel(q.pricing.shippingVoucher)}</span>}
                </span>
              ) : <span className="text-[13px] text-ink-2">Chọn voucher</span>}
            </ChangeRow>
            {notes.platform && <p className="pb-1 text-[12px] text-ink-2" role="status">{notes.platform}</p>}
            {notes.shipping && <p className="pb-1 text-[12px] text-ink-2" role="status">{notes.shipping}</p>}
          </Block>

          {/* Payment (US-CHK-004) */}
          <Block web={web}>
            <ChangeRow icon={<CreditCard size={18} aria-hidden />} title="Phương thức thanh toán" onClick={() => setOverlay({ kind: 'payment' })} web={web}>
              <span className="block truncate text-[14px]">{methodText}</span>
              {!cod.ok && <span className="block text-[12px] text-muted">{cod.reason}</span>}
            </ChangeRow>
          </Block>

          {!web && summary}
        </div>

        {web ? (
          <aside aria-label="Đặt hàng" className="sticky top-6 space-y-4 rounded-[16px] bg-surface p-6">
            {summary}
            {onlineNote}
            {consent}
            {placeBtn}
            {noAddr}
          </aside>
        ) : (
          <div className="fixed inset-x-0 bottom-0 z-30 bg-surface px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar)]">
            <div className="space-y-1 pb-2">{onlineNote}{consent}{noAddr}</div>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-ink-2">Tổng thanh toán</p>
                <p className="tabular text-[18px] font-bold">{vnd(q.pricing.total)}</p>
                {q.pricing.savings > 0 && <p className="tabular text-[12px] font-medium text-jade">Tiết kiệm {vnd(q.pricing.savings)}</p>}
              </div>
              {placeBtn}
            </div>
          </div>
        )}
      </div>

      {overlay?.kind === 'address' && (
        <AddressSheet current={q.address?.id} onClose={() => setOverlay(null)}
          onPick={(id) => { updateCheckout((dd) => { dd.addressId = id }); setOverlay(null) }}
          onEdit={(a) => setOverlay({ kind: 'form', address: a, fromSheet: true })} onAdd={() => setOverlay({ kind: 'form', fromSheet: true })} />
      )}
      <AddressFormSheet open={overlay?.kind === 'form'} initial={overlay?.kind === 'form' ? overlay.address : undefined}
        onClose={() => setOverlay(overlay?.kind === 'form' && overlay.fromSheet ? { kind: 'address' } : null)}
        onSaved={(id) => { updateCheckout((dd) => { dd.addressId = id }); setOverlay(null) }} />
      {overlay?.kind === 'shipping' && (
        <ShippingSheet shop={q.shops.find((s) => s.shop.id === overlay.shopId)!} now={t} onClose={() => setOverlay(null)}
          onPick={(o) => { updateCheckout((dd) => { dd.shipping[overlay.shopId] = o }); setOverlay(null) }} />
      )}
      {overlay?.kind === 'payment' && <PaymentSheet method={d.payment} wallet={wallet} cod={cod} hints={hints} onClose={() => setOverlay(null)} onPick={pickPayment} />}
      {overlay?.kind === 'voucher' && <VoucherSheet q={q} ctx={ctx} onClose={() => setOverlay(null)} onApply={applyVouchers} />}
      <DiffDialog rows={diff?.rows ?? null} empty={!!diff?.empty} onClose={() => setDiff(null)}
        onCart={() => { onPlaced(); nav('/cart', { replace: true }); setSession((s) => { delete s.checkout }) }} />
    </div>
  )
}

function Block({ web, label, children }: { web: boolean; label?: string; children: ReactNode }) {
  return <section aria-label={label} className={cx(web ? 'py-4' : '-mx-4 bg-surface px-4 py-3')}>{children}</section>
}

/** Full-width tappable row with a chevron (US-CHK-001 design notes). */
function ChangeRow({ icon, title, children, aside, action, onClick, web }: {
  icon: ReactNode; title: string; children?: ReactNode; aside?: ReactNode; action?: string; onClick: () => void; web: boolean
}) {
  return (
    <button type="button" onClick={onClick} className="-mx-2 flex min-h-11 w-[calc(100%+16px)] items-start gap-3 rounded-[10px] px-2 py-2 text-left hover:bg-well/60">
      <span className="mt-0.5 shrink-0 text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-muted">{title}</span>
        {children}
      </span>
      {aside && <span className="shrink-0 self-center">{aside}</span>}
      {web && action ? <span className="shrink-0 self-center text-[13px] font-semibold text-jade-ink">{action}</span> : <ChevronRight size={18} aria-hidden className="shrink-0 self-center text-muted" />}
    </button>
  )
}

function MessageField({ shopId, value }: { shopId: string; value: string }) {
  const id = `msg-${shopId}`
  return (
    <div className="mt-1 flex items-center gap-3">
      <label htmlFor={id} className="shrink-0 text-[13px] text-ink-2">Lời nhắn cho Shop</label>
      <input id={id} maxLength={200} value={value} placeholder="Không bắt buộc" aria-describedby={`${id}-n`}
        onChange={(e) => { const v = e.target.value.slice(0, 200); updateCheckout((dd) => { dd.messages[shopId] = v }) }}
        className="h-10 min-w-0 flex-1 rounded-[8px] bg-transparent px-2 text-right text-[13px] outline-none ring-line ring-inset focus:bg-surface focus:ring-1" />
      <span id={`${id}-n`} className="tabular shrink-0 text-[11px] text-muted">{value.length}/200</span>
    </div>
  )
}

function CheckoutSkeleton({ web }: { web: boolean }) {
  return (
    <div aria-busy="true" aria-label="Đang tải trang thanh toán" className={cx(web && 'grid grid-cols-[minmax(0,1fr)_380px] gap-10')}>
      <div className="space-y-6 py-4">
        <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-3/4" /></div>
        <div className="space-y-3"><Skeleton className="h-5 w-48" />{[0, 1].map((i) => <div key={i} className="flex gap-3"><Skeleton className="aspect-[4/5] w-14" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/3" /></div></div>)}</div>
      </div>
      <Skeleton className={web ? 'h-72 rounded-[16px]' : 'h-40'} />
    </div>
  )
}

// US-CRT-001…005: cart grouped by shop, selection and totals, qty/variant/remove, unavailable lines, shop vouchers.
import { BadgeCheck, ChevronDown, ChevronRight, ShoppingBag, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import {
  cartGroups, defaultAddress, flashFor, lineAmount, removeLines, savedUse, setQty, setSelected, skusOf, startCheckout, updateCheckout, useNow, useWorld, type LineView,
} from '@/app/store'
import {
  Button, ButtonLink, Checkbox, Confirm, cx, EmptyState, Img, MoneyFold, PageTitle, QtyStepper, Sheet, Skeleton, toast, useLoaded, vnd,
} from '@/components/ui'
import { signedVnd } from '@/domain/money'
import { ineligibility, voucherLabel } from '@/domain/pricing'
import { etaText, quoteShipping } from '@/domain/shipping'
import type { Shop, Voucher } from '@/domain/types'
import { cartSummary, orderGroups, type CartShopResult } from './cart'
import { setChoice, useChoice } from './choice'
import { VariantSheet } from './VariantSheet'
import { NoVoucherOption, VoucherOption } from './VoucherOption'
import { sheetReason, useDropNotes } from './vouchers'

type Ask = { ids: string[]; title: string } | null

export default function CartPage() {
  const loaded = useLoaded()
  const layout = useLayout()
  const w = useWorld()
  const t = useNow()
  const nav = useNavigate()
  const choice = useChoice()
  const [ask, setAsk] = useState<Ask>(null)
  const [variantFor, setVariantFor] = useState<string | null>(null)
  const [voucherFor, setVoucherFor] = useState<string | null>(null)
  const [clamped, setClamped] = useState<Record<string, number>>({})

  const { groups: raw, unavailable } = cartGroups(w, t)
  const groups = orderGroups(raw)
  const vouchersOf = (shopId: string) => w.vouchers.filter((v) => v.scope === 'shop' && v.shopId === shopId && !v.credit)
  const used = (v: Voucher) => savedUse(w, v.id)
  const inputs = groups.map((g) => ({
    shopId: g.shop.id,
    lines: g.lines.filter((l) => l.line.selected).map((l) => ({ id: l.line.id, unitPrice: lineAmount(l, w, t) / l.line.qty, qty: l.line.qty, beforePromo: l.before })),
    vouchers: vouchersOf(g.shop.id),
  }))
  const summary = cartSummary(inputs, choice, { now: t }, used)
  const resultOf = (shopId: string) => summary.shops.find((s) => s.shopId === shopId)!
  const notes = useDropNotes(Object.fromEntries(summary.shops.map((s) => [s.shopId, s.applied])), (shopId, v) => {
    const goods = summary.shops.find((s) => s.shopId === shopId)?.goods ?? 0
    return ineligibility(v, goods, { now: t, usedByBuyer: used(v) })
  })

  // Unavailable lines are deselected; quantities over stock are clamped once and noted for this visit (US-CRT-004).
  const fixKey = w.cart.map((l) => `${l.id}:${l.qty}:${l.selected}`).join() + unavailable.length
  useEffect(() => {
    const bad = unavailable.filter((v) => v.line.selected).map((v) => v.line.id)
    if (bad.length) setSelected(bad, false)
    const over = groups.flatMap((g) => g.lines).filter((v) => v.availability === 'qty_reduced')
    if (over.length) {
      for (const v of over) setQty(v.line.id, v.sku.stock)
      setClamped((c) => ({ ...c, ...Object.fromEntries(over.map((v) => [v.line.id, v.sku.stock])) }))
    }
  }, [fixKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const available = groups.flatMap((g) => g.lines)
  const allSelected = available.length > 0 && available.every((v) => v.line.selected)
  const someSelected = available.some((v) => v.line.selected)
  const toggleAll = (on: boolean) => setSelected(available.map((v) => v.line.id), on)
  const askRemove = (ids: string[], title = 'Bạn chắc chắn muốn bỏ sản phẩm này?') => setAsk({ ids, title })

  const buy = () => {
    if (!summary.count) { toast('Bạn chưa chọn sản phẩm nào để mua.'); return }
    startCheckout('cart', groups.flatMap((g) => g.lines.filter((l) => l.line.selected).map((l) => ({ skuId: l.sku.id, qty: l.line.qty, cartLineId: l.line.id }))))
    updateCheckout((d) => { for (const s of summary.shops) if (s.count) d.shopVoucher[s.shopId] = s.applied?.id ?? null })
    nav('/checkout')
  }

  const allViews = [...available, ...unavailable]
  const variantView = allViews.find((v) => v.line.id === variantFor) ?? null
  const voucherGroup = groups.find((g) => g.shop.id === voucherFor)
  const address = defaultAddress(w)

  const title = <PageTitle className={layout === 'app' ? 'sr-only' : 'mb-5'}>Giỏ hàng</PageTitle>
  if (!loaded) return <>{title}<CartSkeleton web={layout === 'web'} /></>
  if (!w.cart.length) return (
    <>{title}<EmptyState icon={<ShoppingBag size={24} />} title="Giỏ hàng của bạn còn trống" action={<ButtonLink to="/">Mua sắm ngay</ButtonLink>} /></>
  )

  const selectAll = (
    <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} disabled={!available.length} onChange={toggleAll} label={`Chọn tất cả (${available.length})`} />
  )
  const ledger = (
    <MoneyFold
      label={`Tổng cộng (${summary.count} sản phẩm)`}
      total={summary.total}
      size={layout === 'web' ? 'lg' : 'md'}
      defaultOpen={layout === 'web'}
      lines={[
        { label: 'Tiền hàng', amount: summary.goods },
        ...summary.shops.filter((s) => s.applied).map((s) => ({ label: `Voucher của Shop · ${groups.find((g) => g.shop.id === s.shopId)!.shop.name}: ${voucherLabel(s.applied!)}`, amount: s.discount, tone: 'minus' as const })),
      ]}
    />
  )
  const savings = summary.savings > 0 && <p className="tabular text-[13px] font-medium text-jade">Tiết kiệm {vnd(summary.savings)}</p>

  return (
    <div className={cx(layout === 'app' && 'pb-[calc(120px+env(safe-area-inset-bottom))]')}>
      {title}
      <div className={cx(layout === 'web' && 'grid grid-cols-[minmax(0,1fr)_360px] items-start gap-10')}>
        <div className="min-w-0">
          {layout === 'web' && <div className="border-b border-line pb-1">{selectAll}</div>}
          <div className={cx(layout === 'web' ? 'divide-y divide-line' : '-mx-4 space-y-2')}>
            {groups.map((g) => (
              <ShopGroup key={g.shop.id} shop={g.shop} lines={g.lines} result={resultOf(g.shop.id)} hasVouchers={vouchersOf(g.shop.id).length > 0} note={notes[g.shop.id]}
                shipping={address ? (() => {
                  const q = quoteShipping(g.shop.provinceCode, address.provinceCode, g.lines.reduce((a, l) => a + l.product.weightGrams * l.line.qty, 0), t).find((x) => x.option === 'fast')!
                  return `Phí vận chuyển dự kiến ${vnd(q.fee)} · ${etaText(q.eta, t)}`
                })() : 'Phí vận chuyển tính ở bước Thanh toán'}
                clamped={clamped} app={layout === 'app'}
                onRemove={(id) => askRemove([id])} onVariant={setVariantFor} onVoucher={() => setVoucherFor(g.shop.id)} />
            ))}
            {unavailable.length > 0 && (
              <Unavailable views={unavailable} app={layout === 'app'} onRemove={(id) => askRemove([id])} onVariant={setVariantFor}
                onRemoveAll={() => askRemove(unavailable.map((v) => v.line.id), `Xóa ${unavailable.length} sản phẩm không khả dụng?`)} />
            )}
          </div>
        </div>

        {layout === 'web' ? (
          <aside aria-label="Tổng giỏ hàng" className="sticky top-[128px] space-y-3 rounded-[16px] bg-surface p-6">
            {ledger}
            {savings}
            <Button full size="lg" onClick={buy}>Mua hàng ({summary.count})</Button>
          </aside>
        ) : (
          <div className="fixed inset-x-0 bottom-0 z-30 bg-surface px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar)]">
            <div className="flex items-center gap-3">
              <div className="shrink-0">{selectAll}</div>
              <div className="min-w-0 flex-1 text-right">{ledger}{savings}</div>
            </div>
            <Button full size="lg" className="mt-1" onClick={buy}>Mua hàng ({summary.count})</Button>
          </div>
        )}
      </div>

      <Confirm open={!!ask} onOpenChange={(o) => !o && setAsk(null)} title={ask?.title ?? ''} confirmLabel="Đồng ý" cancelLabel="Không"
        onConfirm={() => { removeLines(ask!.ids); setAsk(null); toast('Đã xóa sản phẩm khỏi giỏ hàng') }} />
      <VariantSheet view={variantView} onClose={() => setVariantFor(null)} />
      {voucherGroup && (
        <ShopVoucherSheet shop={voucherGroup.shop} vouchers={vouchersOf(voucherGroup.shop.id)} result={resultOf(voucherGroup.shop.id)} now={t} used={used}
          onClose={() => setVoucherFor(null)} />
      )}
    </div>
  )
}

/* ── Shop group ───────────────────────────────────────────────────── */

function ShopGroup({ shop, lines, result, hasVouchers, note, shipping, clamped, app, onRemove, onVariant, onVoucher }: {
  shop: Shop; lines: LineView[]; result: CartShopResult; hasVouchers: boolean; note?: string; shipping: string; clamped: Record<string, number>; app: boolean
  onRemove: (id: string) => void; onVariant: (id: string) => void; onVoucher: () => void
}) {
  const all = lines.every((l) => l.line.selected)
  const some = lines.some((l) => l.line.selected)
  return (
    <section aria-label={shop.name} className={cx(app ? 'bg-surface px-4 pb-3' : 'py-5')}>
      <header className={cx('flex min-w-0 items-center gap-1', app && 'sticky top-14 z-10 -mx-4 bg-surface px-4')}>
        <Checkbox checked={all} indeterminate={some && !all} onChange={(on) => setSelected(lines.map((l) => l.line.id), on)} label={<span className="sr-only">Chọn tất cả sản phẩm của {shop.name}</span>} />
        <Link to={`/s/${shop.handle}`} className="flex min-w-0 items-center gap-1.5 text-[16px] font-semibold no-underline hover:underline">
          <span className="truncate">{shop.name}</span>
          <ChevronRight size={16} aria-hidden className="shrink-0" />
        </Link>
        {shop.isOfficial && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-well px-2 py-0.5 text-[11px] font-semibold text-ink-2"><BadgeCheck size={12} aria-hidden />Shop chính hãng</span>}
      </header>
      {!shop.codEnabled && <p className="-mt-1 mb-1 text-[12px] text-muted">Shop không hỗ trợ Thanh toán khi nhận hàng</p>}
      {hasVouchers && (
        <div className="mt-1">
          <button type="button" onClick={onVoucher} className="flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-3 text-left ring-1 ring-line ring-inset hover:ring-line-strong">
            <Ticket size={16} strokeWidth={1.6} aria-hidden className="shrink-0 text-jade" />
            <span className="shrink-0 text-[13px] text-ink-2">Voucher của Shop</span>
            <span className="min-w-0 flex-1 truncate text-right text-[13px]">
              {result.applied ? <span className="font-semibold text-jade-ink">{voucherLabel(result.applied)} <span className="tabular">{signedVnd(-result.discount)}</span></span>
                : !result.count ? <span className="text-muted">Chọn sản phẩm để dùng voucher</span>
                : result.nudge ? <span className="font-medium text-jade-ink">Mua thêm {vnd(result.nudge)} để dùng voucher</span>
                : <span className="text-ink-2">Chọn voucher</span>}
            </span>
            <ChevronRight size={16} aria-hidden className="shrink-0 text-muted" />
          </button>
          {note && <p className="mt-1.5 text-[12px] text-ink-2" role="status">{note}</p>}
        </div>
      )}
      <ul className="divide-y divide-line/70">
        {lines.map((v) => <LineRow key={v.line.id} v={v} clampedTo={clamped[v.line.id]} onRemove={() => onRemove(v.line.id)} onVariant={() => onVariant(v.line.id)} />)}
      </ul>
      <p className="mt-1 text-[12px] text-muted">{shipping}</p>
    </section>
  )
}

function LineRow({ v, clampedTo, onRemove, onVariant }: { v: LineView; clampedTo?: number; onRemove: () => void; onVariant: () => void }) {
  const w = useWorld()
  const t = useNow()
  const amount = lineAmount(v, w, t)
  const f = flashFor(w, v.sku.id, t)
  const split = f && v.line.qty > f.item.perBuyerLimit ? [f.item.perBuyerLimit, v.line.qty - f.item.perBuyerLimit] : null
  const deal = !!v.before && v.before > v.unit
  const atMax = v.line.qty >= v.sku.stock
  return (
    <li className="flex gap-2 py-3">
      <Checkbox checked={v.line.selected} onChange={(on) => setSelected([v.line.id], on)} label={<span className="sr-only">Chọn {v.product.name}</span>} className="self-start" />
      <Link to={`/p/${v.product.slug}`} tabIndex={-1} aria-hidden className="shrink-0">
        <Img src={v.sku.image ?? v.product.images[0]} alt="" className="aspect-[4/5] w-[72px] rounded-[var(--radius-media)] lg:w-24" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Link to={`/p/${v.product.slug}`} className="line-clamp-2 text-[14px] leading-5 no-underline hover:underline" title={v.product.name}>{v.product.name}</Link>
            {v.product.dimensions.length > 0 && v.variant && (
              <button type="button" onClick={onVariant} className="mt-1 inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-well px-2.5 text-[12px] text-ink-2 hover:bg-line">
                <span className="truncate">Phân loại: {v.variant}</span><ChevronDown size={13} aria-hidden className="shrink-0" />
              </button>
            )}
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[14px]">
              <span className={cx('tabular font-semibold', deal ? 'text-jade' : 'text-ink')}>{vnd(v.unit)}</span>
              {deal && <s className="tabular text-[12px] text-muted"><span className="sr-only">Giá trước khuyến mãi </span>{vnd(v.before!)}</s>}
            </p>
            {v.priceChanged !== 0 && <p className="mt-0.5 text-[12px] text-muted">Giá đã thay đổi từ {vnd(v.line.priceAtAdd)}</p>}
            {split && <p className="mt-0.5 text-[12px] text-muted">{split[0]} sản phẩm giá Flash sale, {split[1]} sản phẩm giá thường</p>}
            {clampedTo !== undefined && <p className="mt-0.5 text-[12px] text-muted">Chỉ còn {clampedTo} sản phẩm. Đã cập nhật số lượng.</p>}
          </div>
          <p className="tabular shrink-0 text-[15px] font-semibold whitespace-nowrap">{vnd(amount)}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <QtyStepper value={v.line.qty} min={0} max={v.sku.stock} label={`Số lượng ${v.product.name}`} onChange={(n) => (n < 1 ? onRemove() : setQty(v.line.id, n))} />
          {atMax && clampedTo === undefined && <span className="text-[12px] text-muted">Chỉ còn {v.sku.stock} sản phẩm</span>}
          <button type="button" onClick={onRemove} className="ml-auto min-h-11 px-1 text-[13px] text-muted hover:text-ink">Xóa</button>
        </div>
      </div>
    </li>
  )
}

/* ── Unavailable (US-CRT-004) ─────────────────────────────────────── */

function Unavailable({ views, app, onRemove, onRemoveAll, onVariant }: { views: LineView[]; app: boolean; onRemove: (id: string) => void; onRemoveAll: () => void; onVariant: (id: string) => void }) {
  const w = useWorld()
  const [all, setAll] = useState(false)
  const sorted = useMemo(() => [...views].sort((a, b) => b.line.addedAt - a.line.addedAt), [views])
  const shown = all ? sorted : sorted.slice(0, 3)
  return (
    <section aria-labelledby="cart-unavailable" className={cx(app ? 'bg-surface px-4 pb-3' : 'py-5')}>
      <header className="flex min-h-11 items-center justify-between gap-3">
        <h2 id="cart-unavailable" className="text-[16px] font-semibold">Sản phẩm không khả dụng</h2>
        <button type="button" onClick={onRemoveAll} className="min-h-11 px-1 text-[13px] font-medium text-ink-2 hover:text-ink">Xóa tất cả</button>
      </header>
      <ul className="divide-y divide-line/70">
        {shown.map((v) => {
          const other = v.availability === 'out_of_stock' && skusOf(w, v.product.id).some((k) => k.stock > 0) && v.product.status === 'active'
          return (
            <li key={v.line.id} className="flex gap-3 py-3 pl-9">
              <Img src={v.sku.image ?? v.product.images[0]} alt="" className="aspect-[4/5] w-[72px] shrink-0 rounded-[var(--radius-media)] opacity-50 lg:w-24" />
              <div className="min-w-0 flex-1 text-muted">
                <p className="line-clamp-2 text-[14px] leading-5">{v.product.name}</p>
                {v.variant && <p className="mt-0.5 truncate text-[12px]">Phân loại: {v.variant}</p>}
                <p className="mt-1 text-[13px] font-medium text-ink-2">{v.availability === 'delisted' ? 'Sản phẩm không còn bán' : 'Hết hàng'}</p>
                <div className="mt-1 flex flex-wrap gap-x-4">
                  {other && <button type="button" onClick={() => onVariant(v.line.id)} className="min-h-11 text-[13px] font-semibold text-jade-ink hover:underline">Chọn phân loại khác</button>}
                  <button type="button" onClick={() => onRemove(v.line.id)} className="min-h-11 text-[13px] text-muted hover:text-ink">Xóa</button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      {!all && sorted.length > 3 && <Button variant="ghost" size="sm" onClick={() => setAll(true)}>Xem thêm {sorted.length - 3} sản phẩm</Button>}
    </section>
  )
}

/* ── Shop voucher sheet (US-CRT-005) ──────────────────────────────── */

function ShopVoucherSheet({ shop, vouchers, result, now, used, onClose }: {
  shop: Shop; vouchers: Voucher[]; result: CartShopResult; now: number; used: (v: Voucher) => number; onClose: () => void
}) {
  const [picked, setPicked] = useState<string | null>(result.applied?.id ?? null)
  const readOnly = !result.count
  const rows = vouchers
    .map((v) => ({ v, why: ineligibility(v, result.goods, { now, usedByBuyer: used(v) }) }))
    .sort((a, b) => Number(!!a.why) - Number(!!b.why))
  const name = `shop-voucher-${shop.id}`
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={`Voucher của ${shop.name}`}
      description={readOnly ? 'Chọn sản phẩm để dùng voucher' : undefined}
      footer={<Button full size="lg" disabled={readOnly} onClick={() => { setChoice(shop.id, picked); onClose() }}>Đồng ý</Button>}>
      <fieldset className="space-y-2.5">
        <legend className="sr-only">Chọn một voucher của Shop</legend>
        {rows.map(({ v, why }) => (
          <VoucherOption key={v.id} v={v} name={name} checked={picked === v.id} onPick={() => setPicked(v.id)} now={now} disabled={readOnly}
            reason={why && !(readOnly && why.kind === 'min_spend') ? sheetReason(why) : undefined} />
        ))}
        <NoVoucherOption name={name} checked={picked === null} onPick={() => setPicked(null)} disabled={readOnly} />
      </fieldset>
    </Sheet>
  )
}

function CartSkeleton({ web }: { web: boolean }) {
  return (
    <div aria-busy="true" aria-label="Đang tải giỏ hàng" className={cx(web && 'grid grid-cols-[minmax(0,1fr)_360px] gap-10')}>
      <div className="space-y-4 py-4">
        <Skeleton className="h-5 w-48" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3"><Skeleton className="aspect-[4/5] w-[72px] lg:w-24" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-28 rounded-full" /></div></div>
        ))}
      </div>
      {web ? <Skeleton className="h-56 w-full rounded-[16px]" /> : <Skeleton className="fixed inset-x-0 bottom-0 h-28 rounded-none" />}
    </div>
  )
}

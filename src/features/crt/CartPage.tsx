// US-CRT-001…005: cart grouped by shop, selection and totals, qty/variant/remove, unavailable lines, shop vouchers.
import { BadgeCheck, ChevronDown, ChevronRight, ShoppingBag, Store, Ticket, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import {
  cartGroups, defaultAddress, flashFor, lineAmount, lineParts, removeLines, savedUse, setQty, setSelected, skusOf, startCheckout, toggleFavorite, updateCheckout, useNow, useWorld, type LineView,
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
    lines: g.lines.filter((l) => l.line.selected).flatMap((l) => lineParts(w, l.sku, l.line.qty, t).map((p, j) => ({ id: `${l.line.id}#${j}`, unitPrice: p.price, qty: p.qty, beforePromo: l.before }))),
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
  const selectedIds = available.filter((v) => v.line.selected).map((v) => v.line.id)
  // Savings = product markdowns + shop vouchers; the ledger shows both so it adds up.
  const promo = summary.savings - summary.shopDiscount
  const ledger = (
    <MoneyFold
      label={`Tổng (${summary.count})`}
      total={summary.total}
      size={layout === 'web' ? 'lg' : 'md'}
      lines={[
        ...(promo > 0 ? [{ label: 'Giá trước khuyến mãi', amount: summary.goods + promo }, { label: 'Giảm giá sản phẩm', amount: promo, tone: 'minus' as const }] : [{ label: 'Tiền hàng', amount: summary.goods }]),
        ...summary.shops.filter((s) => s.applied).map((s) => ({ label: `Voucher của Shop · ${groups.find((g) => g.shop.id === s.shopId)!.shop.name}: ${voucherLabel(s.applied!)}`, amount: s.discount, tone: 'minus' as const })),
      ]}
    />
  )
  const savings = summary.savings > 0 && <p className="tabular text-[12px] font-medium text-accent-ink">Tiết kiệm {vnd(summary.savings)}</p>
  const web = layout === 'web'

  return (
    <div className={cx(!web && 'pb-[calc(128px+env(safe-area-inset-bottom))]')}>
      {title}
      <div className="space-y-3 max-lg:space-y-2">
        {web && (
          <div className={cx(COLS, 'panel h-12 items-center px-5 text-[13px] text-ink-2')}>
            <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} disabled={!available.length} onChange={toggleAll} label="Chọn tất cả" className="text-ink" />
            <span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Số tiền</span><span>Thao tác</span>
          </div>
        )}
        {groups.map((g) => (
          <ShopGroup key={g.shop.id} shop={g.shop} lines={g.lines} result={resultOf(g.shop.id)} hasVouchers={vouchersOf(g.shop.id).length > 0} note={notes[g.shop.id]}
            shipping={address ? (() => {
              const q = quoteShipping(g.shop.provinceCode, address.provinceCode, g.lines.reduce((a, l) => a + l.product.weightGrams * l.line.qty, 0), t).find((x) => x.option === 'fast')!
              return `Phí vận chuyển dự kiến ${vnd(q.fee)} · ${etaText(q.eta, t)}`
            })() : 'Phí vận chuyển tính ở bước Thanh toán'}
            clamped={clamped} app={!web}
            onRemove={(id) => askRemove([id])} onVariant={setVariantFor} onVoucher={() => setVoucherFor(g.shop.id)} />
        ))}
        {unavailable.length > 0 && (
          <Unavailable views={unavailable} app={!web} onRemove={(id) => askRemove([id])} onVariant={setVariantFor}
            onRemoveAll={() => askRemove(unavailable.map((v) => v.line.id), `Xóa ${unavailable.length} sản phẩm không khả dụng?`)} />
        )}
        <section aria-label="Voucher Market" className={cx('panel flex min-h-14 items-center gap-2.5', web ? 'px-5' : 'px-3')}>
          <Ticket size={18} strokeWidth={1.8} aria-hidden className="shrink-0 text-accent" />
          <span className="text-[14px] font-semibold">Voucher Market</span>
          <span className="min-w-0 flex-1 truncate text-right text-[13px] text-muted">Chọn ở bước Thanh toán</span>
          <Link to="/vouchers" className="shrink-0 text-[13px] font-semibold text-accent-ink no-underline hover:underline">Kho voucher</Link>
        </section>

        {web ? (
          <aside aria-label="Tổng giỏ hàng" className="panel sticky bottom-0 z-20 flex items-end gap-6 px-5 py-3 shadow-[var(--shadow-bar)]">
            <div className="flex h-12 shrink-0 items-center gap-4">
              {selectAll}
              <button type="button" disabled={!selectedIds.length} onClick={() => askRemove(selectedIds, `Xóa ${selectedIds.length} sản phẩm đã chọn?`)}
                className="min-h-11 px-1 text-[14px] text-ink-2 hover:text-accent-ink disabled:cursor-not-allowed disabled:text-line-strong">Xóa</button>
            </div>
            <div className="ml-auto w-[400px] min-w-0">{ledger}{savings && <div className="text-right">{savings}</div>}</div>
            <Button size="lg" className="h-12 w-[180px] text-[16px]" onClick={buy}>Mua hàng ({summary.count})</Button>
          </aside>
        ) : (
          <div className="fixed inset-x-0 bottom-0 z-30 bg-surface px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar)]">
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

/** Web cart columns: select + image, product, unit price, quantity, amount, actions. */
const COLS = 'grid grid-cols-[132px_minmax(0,1fr)_136px_128px_128px_88px] gap-x-4'

/* ── Shop group ───────────────────────────────────────────────────── */

function ShopGroup({ shop, lines, result, hasVouchers, note, shipping, clamped, app, onRemove, onVariant, onVoucher }: {
  shop: Shop; lines: LineView[]; result: CartShopResult; hasVouchers: boolean; note?: string; shipping: string; clamped: Record<string, number>; app: boolean
  onRemove: (id: string) => void; onVariant: (id: string) => void; onVoucher: () => void
}) {
  const all = lines.every((l) => l.line.selected)
  const some = lines.some((l) => l.line.selected)
  return (
    <section aria-label={shop.name} className={cx('panel', app ? 'px-3 pb-2' : 'px-5 pb-3')}>
      <header className={cx('flex min-w-0 flex-wrap items-center gap-x-2 border-b border-line', app ? 'pb-1' : 'pb-1.5')}>
        <Checkbox checked={all} indeterminate={some && !all} onChange={(on) => setSelected(lines.map((l) => l.line.id), on)} label={<span className="sr-only">Chọn tất cả sản phẩm của {shop.name}</span>} />
        <Link to={`/s/${shop.handle}`} className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold no-underline hover:text-accent-ink">
          <Store size={16} aria-hidden className="shrink-0 text-ink-2" />
          <span className="truncate">{shop.name}</span>
          <ChevronRight size={16} aria-hidden className="shrink-0 text-muted" />
        </Link>
        {shop.isOfficial && <span className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-well px-1.5 py-0.5 text-[11px] font-semibold text-ink-2"><BadgeCheck size={12} aria-hidden />Shop chính hãng</span>}
        {!shop.codEnabled && <span className="text-[12px] text-muted">Shop không hỗ trợ Thanh toán khi nhận hàng</span>}
        {hasVouchers && (
          <button type="button" onClick={onVoucher} className={cx('flex min-h-9 max-w-full min-w-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-accent-soft px-2.5 text-left text-[13px] text-accent-ink hover:bg-[#fbdde3]', app ? 'mb-1.5 w-full' : 'ml-auto')}>
            <Ticket size={15} strokeWidth={1.8} aria-hidden className="shrink-0 text-accent" />
            <span className="shrink-0 font-medium">Voucher của Shop</span>
            <span className="min-w-0 flex-1 truncate text-right">
              {result.applied ? <span className="font-semibold">{voucherLabel(result.applied)} <span className="tabular">{signedVnd(-result.discount)}</span></span>
                : !result.count ? <span className="text-ink-2">Chọn sản phẩm để dùng voucher</span>
                : result.nudge ? <span className="font-medium">Mua thêm {vnd(result.nudge)} để dùng voucher</span>
                : <span>Chọn voucher</span>}
            </span>
            <ChevronRight size={15} aria-hidden className="shrink-0" />
          </button>
        )}
      </header>
      {note && <p className="pt-2 text-[12px] text-ink-2" role="status">{note}</p>}
      <ul className="divide-y divide-line">
        {lines.map((v) => <LineRow key={v.line.id} v={v} app={app} clampedTo={clamped[v.line.id]} onRemove={() => onRemove(v.line.id)} onVariant={() => onVariant(v.line.id)} />)}
      </ul>
      <p className="flex items-center gap-1.5 border-t border-line pt-2.5 text-[12px] text-muted"><Truck size={14} aria-hidden className="shrink-0" />{shipping}</p>
    </section>
  )
}

function LineRow({ v, app, clampedTo, onRemove, onVariant }: { v: LineView; app: boolean; clampedTo?: number; onRemove: () => void; onVariant: () => void }) {
  const w = useWorld()
  const t = useNow()
  const amount = lineAmount(v, w, t)
  const f = flashFor(w, v.sku.id, t)
  const split = f && v.line.qty > f.item.perBuyerLimit ? [f.item.perBuyerLimit, v.line.qty - f.item.perBuyerLimit] : null
  const deal = !!v.before && v.before > v.unit
  const atMax = v.line.qty >= v.sku.stock
  const fav = w.favorites.includes(v.product.id)

  const check = <Checkbox checked={v.line.selected} onChange={(on) => setSelected([v.line.id], on)} label={<span className="sr-only">Chọn {v.product.name}</span>} className="self-start" />
  const image = (
    <Link to={`/p/${v.product.slug}`} tabIndex={-1} aria-hidden className="shrink-0">
      <Img src={v.sku.image ?? v.product.images[0]} alt="" className={cx('aspect-square rounded-[var(--radius-control)]', app ? 'w-[76px]' : 'w-20')} />
    </Link>
  )
  const name = (
    <>
      <Link to={`/p/${v.product.slug}`} className="line-clamp-2 text-[14px] leading-5 no-underline hover:text-accent-ink" title={v.product.name}>{v.product.name}</Link>
      {v.product.dimensions.length > 0 && v.variant && (
        <button type="button" onClick={onVariant} className="mt-1.5 inline-flex h-7 max-w-full items-center gap-1 rounded-[var(--radius-control)] bg-well px-2 text-[12px] text-ink-2 ring-1 ring-inset ring-transparent hover:ring-line-strong">
          <span className="truncate">Phân loại: {v.variant}</span><ChevronDown size={13} aria-hidden className="shrink-0" />
        </button>
      )}
    </>
  )
  const price = (
    <p className={cx('flex flex-wrap items-baseline gap-x-2', !app && 'flex-col')}>
      <span className="tabular text-[14px] font-semibold text-accent">{vnd(v.unit)}</span>
      {deal && <s className="tabular text-[12px] text-muted"><span className="sr-only">Giá trước khuyến mãi </span>{vnd(v.before!)}</s>}
    </p>
  )
  const notes = (
    <>
      {v.priceChanged !== 0 && <p className="mt-1 text-[12px] text-muted">Giá đã thay đổi từ {vnd(v.line.priceAtAdd)}</p>}
      {split && <p className="mt-1 text-[12px] text-muted">{split[0]} sản phẩm giá Flash sale, {split[1]} sản phẩm giá thường</p>}
      {clampedTo !== undefined && <p className="mt-1 text-[12px] text-warn">Chỉ còn {clampedTo} sản phẩm. Đã cập nhật số lượng.</p>}
    </>
  )
  const stepper = <QtyStepper value={v.line.qty} min={0} max={v.sku.stock} label={`Số lượng ${v.product.name}`} onChange={(n) => (n < 1 ? onRemove() : setQty(v.line.id, n))} />
  const stock = atMax && clampedTo === undefined && <span className="text-[12px] text-muted">Chỉ còn {v.sku.stock} sản phẩm</span>
  const actLink = 'min-h-8 text-left text-[13px] text-ink-2 hover:text-accent-ink'
  const remove = <button type="button" onClick={onRemove} className={actLink}>Xóa</button>
  const like = (
    <button type="button" aria-pressed={fav} aria-label={fav ? `Bỏ yêu thích ${v.product.name}` : `Yêu thích ${v.product.name}`} className={cx(actLink, fav && 'text-accent-ink')}
      onClick={() => { const on = toggleFavorite(v.product.id); toast(on ? 'Đã thêm vào Yêu thích' : 'Đã bỏ khỏi Yêu thích', { action: { label: 'Hoàn tác', onClick: () => toggleFavorite(v.product.id) } }) }}>
      {fav ? 'Đã yêu thích' : 'Yêu thích'}
    </button>
  )

  if (!app) return (
    <li className={cx(COLS, 'py-4')}>
      <div className="flex items-start gap-3">{check}{image}</div>
      <div className="min-w-0 pt-0.5">{name}{notes}</div>
      <div className="pt-0.5">{price}</div>
      <div className="flex flex-col items-start gap-1">{stepper}{stock}</div>
      <p className="tabular pt-0.5 text-[15px] font-bold whitespace-nowrap text-accent">{vnd(amount)}</p>
      <div className="flex flex-col items-start">{remove}{like}</div>
    </li>
  )
  return (
    <li className="flex gap-2 py-3">
      {check}{image}
      <div className="min-w-0 flex-1">
        {name}
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          {price}
          <p className="tabular shrink-0 text-[15px] font-bold whitespace-nowrap text-accent">{vnd(amount)}</p>
        </div>
        {notes}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {stepper}{stock}
          <span className="ml-auto flex gap-3">{like}{remove}</span>
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
    <section aria-labelledby="cart-unavailable" className={cx('panel', app ? 'px-3 pb-2' : 'px-5 pb-3')}>
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-line">
        <h2 id="cart-unavailable" className="text-[15px] font-semibold">Sản phẩm không khả dụng</h2>
        <button type="button" onClick={onRemoveAll} className="min-h-11 px-1 text-[13px] font-medium text-ink-2 hover:text-accent-ink">Xóa tất cả</button>
      </header>
      <ul className="divide-y divide-line">
        {shown.map((v) => {
          const other = v.availability === 'out_of_stock' && skusOf(w, v.product.id).some((k) => k.stock > 0) && v.product.status === 'active'
          return (
            <li key={v.line.id} className={cx('flex gap-3 py-3', app ? 'pl-[30px]' : 'pl-8')}>
              <Img src={v.sku.image ?? v.product.images[0]} alt="" className="aspect-square w-[76px] shrink-0 rounded-[var(--radius-control)] opacity-50 grayscale lg:w-20" />
              <div className="min-w-0 flex-1 text-muted">
                <p className="line-clamp-2 text-[14px] leading-5">{v.product.name}</p>
                {v.variant && <p className="mt-0.5 truncate text-[12px]">Phân loại: {v.variant}</p>}
                <p className="mt-1.5"><span className="rounded-[4px] bg-well px-1.5 py-0.5 text-[12px] font-semibold text-ink-2">{v.availability === 'delisted' ? 'Sản phẩm không còn bán' : 'Hết hàng'}</span></p>
                <div className="mt-1 flex flex-wrap gap-x-4">
                  {other && <button type="button" onClick={() => onVariant(v.line.id)} className="min-h-11 text-[13px] font-semibold text-accent-ink hover:underline">Chọn phân loại khác</button>}
                  <button type="button" onClick={() => onRemove(v.line.id)} className="min-h-11 text-[13px] text-ink-2 hover:text-accent-ink">Xóa</button>
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
    <div aria-busy="true" aria-label="Đang tải giỏ hàng" className="space-y-3">
      {web && <Skeleton className="h-12 w-full rounded-[var(--radius-card)]" />}
      <div className={cx('panel space-y-4', web ? 'p-5' : 'p-3')}>
        <Skeleton className="h-5 w-48" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3"><Skeleton className="aspect-square w-20" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-28" /></div></div>
        ))}
      </div>
      {!web && <Skeleton className="fixed inset-x-0 bottom-0 h-28 rounded-none" />}
    </div>
  )
}

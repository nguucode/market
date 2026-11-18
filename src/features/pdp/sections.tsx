import type { ReactNode } from 'react'
// Product page sections: price block (US-PDP-002), shop vouchers (010), shipping (005), shop card (006), specs/description/policies (007).
import { BadgeCheck, ChevronDown, ChevronRight, MapPin, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { defaultAddress, saveVoucher, useNow, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, Sheet, toast, RatingText } from '@/components/ui'
import { compactCount, compactVnd, vnd } from '@/domain/money'
import { voucherLabel } from '@/domain/pricing'
import { etaText, OPTION_LABEL, quoteShipping } from '@/domain/shipping'
import type { Category, Product, Shop, Voucher } from '@/domain/types'
import { countdownText, dateText, expiryText, feeRange, liveShopVouchers, specRows, voucherFull, voucherState, warrantyText, type PriceBlock } from './pdp'

/* ── Price block ──────────────────────────────────────────────────── */

export function PriceBlockView({ block: b, compact }: { block: PriceBlock; compact?: boolean }) {
  const t = useNow(60_000)
  const big = compact ? 'text-[22px]' : 'text-[24px] lg:text-[28px]'
  const deal = b.kind === 'single' ? b.pct > 0 : b.maxPct > 0
  const flashLive = b.flash && !b.flash.soldOut
  return (
    <div>
      {b.flash && (
        <p className={cx('mb-2 flex flex-wrap items-baseline gap-x-2 border-y border-jade/25 bg-jade-soft/60 py-1.5 text-[13px]', compact ? 'px-3' : '-mx-4 px-4 lg:mx-0 lg:rounded-[8px] lg:border-0 lg:px-3')}>
          <span className="font-semibold text-jade-ink">Flash sale</span>
          <span className="text-ink-2">{b.flash.soldOut ? 'Flash sale đã hết suất' : `Kết thúc sau ${countdownText(b.flash.endsAt - t)}`}</span>
        </p>
      )}
      <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={cx('tabular font-bold', big, deal ? 'text-jade' : 'text-ink')}>
          {b.kind === 'range' ? <>{vnd(b.min)}<span className="mx-1 font-normal text-muted">–</span><wbr />{vnd(b.max)}</> : vnd(b.price)}
        </span>
        {b.kind === 'single' && b.pct > 0 && (
          <span className="inline-flex items-baseline gap-2">
            <s className="tabular text-[14px] text-muted"><span className="sr-only">Giá trước khuyến mãi </span>{vnd(b.before!)}</s>
            <span className="rounded-full bg-jade-soft px-2 py-0.5 text-[12px] font-semibold text-jade-ink">-{b.pct}%</span>
          </span>
        )}
        {b.kind === 'range' && b.maxPct > 0 && <span className="rounded-full bg-jade-soft px-2 py-0.5 text-[12px] font-semibold text-jade-ink">Giảm đến {b.maxPct}%</span>}
      </p>
      {flashLive && <p className="mt-1.5 text-[12px] text-muted">Giá Flash sale áp dụng cho tối đa {b.flash!.limit} sản phẩm mỗi khách</p>}
    </div>
  )
}

/* ── Shop vouchers ────────────────────────────────────────────────── */

function SaveButton({ v }: { v: Voucher }) {
  const w = useWorld()
  const [busy, setBusy] = useState(false)
  const st = voucherState(w, v)
  if (st !== 'save') return <Button size="sm" variant="secondary" disabled>{st === 'saved' ? 'Đã lưu' : st === 'used' ? 'Đã dùng' : 'Đã hết lượt'}</Button>
  return (
    <Button size="sm" loading={busy} onClick={async () => {
      setBusy(true)
      try {
        if (await saveVoucher(v.id)) toast('Đã lưu voucher')
        else toast('Không lưu được voucher. Thử lại.', { tone: 'error' })
      } catch { toast('Không lưu được voucher. Thử lại.', { tone: 'error' }) }
      setBusy(false)
    }}>Lưu<span className="sr-only"> voucher {voucherLabel(v)}</span></Button>
  )
}

export function ShopVouchers({ shop }: { shop: Shop }) {
  const w = useWorld()
  const t = useNow(60_000)
  const [open, setOpen] = useState(false)
  const live = liveShopVouchers(w.vouchers, shop.id, t)
  if (!live.some((v) => v.usedCount < v.totalQuota)) return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 w-full items-center gap-3 text-left" aria-haspopup="dialog">
        <span className="shrink-0 text-[13px] text-muted">Voucher của Shop</span>
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5 max-lg:flex-nowrap max-lg:overflow-hidden max-lg:[mask-image:linear-gradient(to_right,#000_85%,transparent)]">
          {live.slice(0, 3).map((v) => (
            <span key={v.id} className="shrink-0 rounded-full bg-jade-soft px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap text-jade-ink">{voucherLabel(v)}{v.minSpend > 0 && <span className="font-normal"> · đơn từ {compactVnd(v.minSpend)}</span>}</span>
          ))}
        </span>
        <span className="flex shrink-0 items-center text-[13px] text-ink-2">{live.length > 3 && 'Xem tất cả'}<ChevronRight size={16} aria-hidden /></span>
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Voucher của Shop" description={shop.name}>
        <ul className="space-y-3">
          {live.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-[12px] bg-ground p-3.5">
              <div className="min-w-0 flex-1 text-[13px]">
                <p className="text-[14px] font-semibold">{voucherFull(v)}</p>
                <p className="mt-0.5 text-ink-2">Đơn tối thiểu {vnd(v.minSpend)}</p>
                <p className="mt-0.5 text-muted">{expiryText(v.endsAt, t)} · <Link to={`/vouchers?voucher=${v.id}`} className="text-ink-2 underline underline-offset-2">Điều kiện</Link></p>
              </div>
              <SaveButton v={v} />
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}

/* ── Shipping estimate ────────────────────────────────────────────── */

export function ShippingRow({ product, shop, weightGrams, muted }: { product: Product; shop: Shop; weightGrams: number; muted?: boolean }) {
  const w = useWorld()
  const t = useNow(60_000)
  const [open, setOpen] = useState(false)
  const [pickAddr, setPickAddr] = useState(false)
  const [addrId, setAddrId] = useState<string>()
  const addr = w.addresses.find((a) => a.id === addrId) ?? defaultAddress(w)

  if (!addr) {
    const [lo, hi] = feeRange(shop.provinceCode, weightGrams, t)
    return (
      <div className={cx('flex gap-3 py-1 text-[13px]', muted && 'opacity-70')}>
        <Truck size={18} aria-hidden className="mt-0.5 shrink-0 text-ink-2" />
        <div><p>Thêm địa chỉ nhận hàng để xem phí vận chuyển</p><p className="tabular text-muted">Phí vận chuyển {vnd(lo)} – {vnd(hi)}</p></div>
      </div>
    )
  }
  const quotes = quoteShipping(shop.provinceCode, addr.provinceCode, weightGrams, t)
  const cheapest = quotes.reduce((a, q) => (q.fee < a.fee ? q : a))
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={cx('flex min-h-11 w-full items-start gap-3 py-1 text-left text-[13px]', muted && 'opacity-70')}>
        <Truck size={18} aria-hidden className="mt-0.5 shrink-0 text-ink-2" />
        <span className="min-w-0 flex-1">
          <span className="block">Vận chuyển tới <span className="font-semibold">{addr.wardName}, {addr.provinceName}</span></span>
          <span className="tabular block text-ink-2">Phí vận chuyển {vnd(cheapest.fee)} · {etaText(cheapest.eta, t)}</span>
          {product.freeShipEligible && <span className="block text-jade-ink">Freeship với Voucher miễn phí vận chuyển</span>}
        </span>
        <ChevronRight size={16} aria-hidden className="mt-0.5 shrink-0 text-muted" />
      </button>
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPickAddr(false) }} title="Phương thức vận chuyển" description={`Gửi từ ${shop.provinceName}`}>
        <div className="mb-4 flex items-start gap-2.5 rounded-[12px] bg-ground p-3.5 text-[13px]">
          <MapPin size={16} aria-hidden className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1"><span className="font-semibold">{addr.name}</span><span className="block text-ink-2">{addr.detail}, {addr.wardName}, {addr.provinceName}</span></p>
          {w.addresses.length > 1 && <Button size="sm" variant="ghost" aria-expanded={pickAddr} onClick={() => setPickAddr((p) => !p)}>Đổi địa chỉ</Button>}
        </div>
        {pickAddr && (
          <ul className="mb-4 space-y-1" aria-label="Địa chỉ đã lưu">
            {w.addresses.map((a) => (
              <li key={a.id}>
                <button type="button" aria-pressed={a.id === addr.id} onClick={() => { setAddrId(a.id); setPickAddr(false) }} className="w-full rounded-[10px] px-3 py-2.5 text-left text-[13px] hover:bg-well aria-pressed:bg-jade-soft/60">
                  <span className="font-semibold">{a.name}</span>{a.isDefault && <span className="ml-2 text-[12px] text-muted">Mặc định</span>}
                  <span className="block text-ink-2">{a.detail}, {a.wardName}, {a.provinceName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <ul className="divide-y divide-line">
          {quotes.map((q) => (
            <li key={q.option} className="flex items-baseline justify-between gap-4 py-3 text-[14px]">
              <span><span className="font-semibold">{OPTION_LABEL[q.option]}</span><span className="block text-[13px] text-muted">{etaText(q.eta, t)} · {q.carrier}</span></span>
              <span className="tabular">{vnd(q.fee)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-muted">Phương thức được chọn khi thanh toán. Đổi địa chỉ ở đây chỉ để xem phí, không đổi địa chỉ mặc định.</p>
      </Sheet>
    </>
  )
}

/* ── Policies ─────────────────────────────────────────────────────── */

export function Policies({ product, shop }: { product: Product; shop: Shop }) {
  return (
    <section aria-label="Chính sách" className="space-y-2 text-[13px]">
      <p className="flex items-center gap-2.5"><RotateCcw size={16} aria-hidden className="shrink-0 text-ink-2" />Trả hàng/Hoàn tiền trong {shop.policies.returnDays} ngày</p>
      <p className="flex items-center gap-2.5"><ShieldCheck size={16} aria-hidden className="shrink-0 text-ink-2" />Bảo hành: {warrantyText(product, shop)}</p>
      <Link to="/policies/quy-che" className="inline-block pl-[26px] text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink">Xem chi tiết</Link>
    </section>
  )
}

/* ── Shop card ────────────────────────────────────────────────────── */

export function SellerInfo({ shop }: { shop: Shop }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="border-t border-line">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex min-h-11 w-full items-center justify-between text-left text-[14px] font-medium">
        Thông tin người bán<ChevronDown size={16} aria-hidden className={cx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <dl id={id} className="grid gap-x-6 gap-y-2 pb-3 text-[13px] lg:grid-cols-[180px_1fr]">
          <dt className="text-muted">Tên doanh nghiệp</dt><dd className="flex flex-wrap items-center gap-2">{shop.legalName}<span className="inline-flex items-center gap-1 rounded-full bg-well px-2 py-0.5 text-[11px] font-semibold text-ink-2"><BadgeCheck size={12} aria-hidden />Đã xác thực</span></dd>
          <dt className="text-muted">Địa chỉ kinh doanh</dt><dd>{shop.businessAddress}</dd>
          <dt className="text-muted">Mã số doanh nghiệp</dt><dd className="tabular">{shop.businessCode}</dd>
        </dl>
      )}
    </div>
  )
}

export function ShopCard({ shop }: { shop: Shop }) {
  const w = useWorld()
  const layout = useLayout()
  const count = w.products.filter((p) => p.shopId === shop.id && p.status === 'active').length
  const to = `/s/${shop.handle}`
  const facts = [
    <RatingText key="r" value={shop.rating} count={compactCount(shop.ratingCount)} />,
    `${count.toLocaleString('vi-VN')} sản phẩm`,
    `Tỉ lệ phản hồi ${shop.responseRate}%`,
    shop.responseTime && `Phản hồi ${shop.responseTime}`,
    `Tham gia ${dateText(shop.joinedAt)}`,
  ].filter(Boolean) as ReactNode[]
  return (
    <section aria-label="Thông tin shop">
      <div className="flex items-start gap-3 pb-3 lg:items-center lg:gap-4">
        <Link to={to} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[18px] font-semibold text-ground no-underline lg:size-16 lg:text-[22px]" aria-hidden tabIndex={-1}>
          {shop.name.split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <Link to={to} className="truncate font-display text-[17px] font-semibold text-ink no-underline hover:underline lg:text-[20px]" title={shop.name}>{shop.name}</Link>
            {shop.isOfficial && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-ground"><BadgeCheck size={12} aria-hidden />Shop chính hãng</span>}
          </div>
          <p className="mt-0.5 text-[12px] text-muted">{shop.provinceName}</p>
          {layout === 'web' ? (
            <p className="mt-1.5 flex flex-wrap gap-x-2 text-[13px] text-ink-2">{facts.map((f, i) => <span key={i}>{i > 0 && <span aria-hidden className="mr-2 text-muted">·</span>}{f}</span>)}</p>
          ) : (
            <dl className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
              <div><dt className="text-muted">Đánh giá</dt><dd className="font-semibold"><RatingText value={shop.rating} /></dd></div>
              <div><dt className="text-muted">Sản phẩm</dt><dd className="font-semibold">{count}</dd></div>
              <div><dt className="text-muted">Phản hồi</dt><dd className="font-semibold">{shop.responseRate}%</dd></div>
            </dl>
          )}
        </div>
        <ButtonLink to={to} variant="secondary" size="sm" className="shrink-0">Xem shop</ButtonLink>
      </div>
      <SellerInfo shop={shop} />
    </section>
  )
}

/* ── Specs and description ────────────────────────────────────────── */

export function Specs({ product, crumbs, shop, collapsible }: { product: Product; crumbs: Category[]; shop: Shop; collapsible?: boolean }) {
  const rows = specRows(product, crumbs, shop)
  const [all, setAll] = useState(!collapsible)
  const shown = all ? rows : rows.slice(0, 5)
  return (
    <section aria-labelledby="pdp-specs">
      <h2 id="pdp-specs" className="mb-2 font-display text-[19px] font-semibold lg:text-[20px]">Thông số</h2>
      <dl className="divide-y divide-line text-[14px]">
        {shown.map((r) => (
          <div key={r.label} className="grid gap-0.5 py-2.5 lg:grid-cols-[30%_1fr] lg:gap-6">
            <dt className="text-muted">{r.label}</dt>
            <dd className="min-w-0">
              {r.crumbs ? r.crumbs.map((c, i) => <span key={c.id}>{i > 0 && <span aria-hidden className="mx-1 text-muted">›</span>}<Link to={`/c/${c.slug}`} className="text-ink-2 hover:text-ink">{c.name}</Link></span>) : r.value}
            </dd>
          </div>
        ))}
      </dl>
      {rows.length > 5 && collapsible && <button type="button" aria-expanded={all} onClick={() => setAll((a) => !a)} className="mt-1 min-h-11 text-[13px] font-semibold text-jade-ink">{all ? 'Thu gọn' : 'Xem thêm'}</button>}
    </section>
  )
}

export function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [clamps, setClamps] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { const el = ref.current; if (el && !open) setClamps(el.scrollHeight > el.clientHeight + 2) }, [text, open])
  return (
    <section aria-labelledby="pdp-desc">
      <h2 id="pdp-desc" className="mb-2 font-display text-[19px] font-semibold lg:text-[20px]">Mô tả sản phẩm</h2>
      <div ref={ref} className={cx('max-w-[760px] space-y-3 text-[14px] leading-6 text-ink-2', !open && 'line-clamp-[10]')}>
        {text.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
      </div>
      {(clamps || open) && <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-1 min-h-11 text-[13px] font-semibold text-jade-ink">{open ? 'Thu gọn' : 'Xem thêm'}</button>}
    </section>
  )
}

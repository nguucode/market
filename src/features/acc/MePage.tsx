// US-ACC-001: Me page, order shortcuts with counts, menu rows, followed shops.
import { ChevronRight, CircleHelp, Heart, LogOut, MapPin, Package, PackageCheck, Ticket, Truck, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { defaultAddress, useNow, useWorld } from '@/app/store'
import { PageTitle, Skeleton, useLoaded } from '@/components/ui'
import { addressLine, badgeText, maskPhone, orderTabCounts } from './account'
import { AccountNav } from './AccountNav'

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()

export default function MePage() {
  const loaded = useLoaded()
  const web = useLayout() === 'web'
  const w = useWorld()
  const t = useNow()
  const counts = orderTabCounts(w.orders)
  const usableVouchers = w.savedVouchers.filter((s) => {
    const v = w.vouchers.find((x) => x.id === s.voucherId)
    return v && v.startsAt <= t && t < v.endsAt && v.usedCount < v.totalQuota && s.usedCount < v.perBuyerLimit
  }).length
  const addr = defaultAddress(w)
  const follows = w.follows.map((id) => w.shops.find((s) => s.id === id)!).filter(Boolean)

  const shortcuts: [string, number, string, typeof Wallet][] = [
    ['Chờ thanh toán', counts.awaiting_payment, 'awaiting_payment', Wallet],
    ['Chờ lấy hàng', counts.to_ship, 'to_ship', Package],
    ['Đang giao', counts.shipping, 'shipping', Truck],
    ['Đã giao', counts.delivered, 'delivered', PackageCheck],
  ]

  const content = !loaded ? (
    <div role="status" aria-busy="true" aria-label="Đang tải" className="space-y-2 lg:space-y-3">
      <div className="panel flex items-center gap-3 p-4"><Skeleton className="size-14 rounded-full" /><div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-28" /></div></div>
      <Skeleton className="h-32" /><Skeleton className="h-28" />
    </div>
  ) : (
    <div className="space-y-2 lg:space-y-3">
      <header className="panel flex items-center gap-3.5 p-4 lg:p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-[18px] font-bold text-white lg:size-16 lg:text-[20px]" aria-hidden>{w.buyer.avatarInitials}</span>
        <div className="min-w-0">
          <p className="truncate font-display text-[18px] lg:text-[20px]">{w.buyer.name}</p>
          <p className="tabular text-[13px] text-muted">{maskPhone(w.buyer.phone)}</p>
        </div>
      </header>

      <section aria-labelledby="me-orders" className="panel p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="me-orders" className="font-display text-[16px]">Đơn mua</h2>
          <Link to="/orders" className="inline-flex min-h-11 items-center gap-0.5 text-[13px] text-accent-ink no-underline hover:underline">Xem lịch sử mua hàng<ChevronRight size={16} aria-hidden /></Link>
        </div>
        {!w.orders.length && <p className="text-[13px] text-muted">Bạn chưa có đơn hàng nào</p>}
        <ul className="mt-2 grid grid-cols-4 gap-1">
          {shortcuts.map(([label, n, status, Icon]) => (
            <li key={status}>
              <Link to={`/orders?status=${status}`} className="relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-control)] text-center text-[12px] text-ink-2 no-underline hover:bg-well hover:text-accent-ink">
                <span className="relative">
                  <Icon size={26} strokeWidth={1.5} aria-hidden className="text-ink" />
                  {n > 0 && <span className="tabular absolute -top-2 left-4 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white ring-2 ring-surface" aria-hidden>{badgeText(n)}</span>}
                </span>
                <span className="leading-tight">{label}{n > 0 && <span className="sr-only">, {n} đơn</span>}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Tiện ích" className="panel p-2 lg:p-3">
        <ul className="grid grid-cols-2 gap-1 lg:grid-cols-4">
          <Tile to="/vouchers" icon={<Ticket size={22} aria-hidden />} label="Kho voucher" value={usableVouchers ? `${usableVouchers} voucher` : undefined} />
          <Tile to="/favorites" icon={<Heart size={22} aria-hidden />} label="Yêu thích" value={w.favorites.length ? `${w.favorites.length} sản phẩm` : undefined} />
          <Tile to="/me/addresses" icon={<MapPin size={22} aria-hidden />} label="Địa chỉ của tôi" sub={addr ? addressLine(addr) : 'Chưa có địa chỉ'} />
          <Tile to="/policies/khieu-nai" icon={<CircleHelp size={22} aria-hidden />} label="Trung tâm trợ giúp" />
        </ul>
      </section>

      <div className="space-y-2 lg:space-y-3">
          <section aria-labelledby="me-follows" className="panel p-4 lg:p-5">
            <h2 id="me-follows" className="font-display text-[16px]">Shop đang theo dõi</h2>
            {follows.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {follows.slice(0, 8).map((s) => (
                  <li key={s.id}>
                    <Link to={`/s/${s.handle}`} title={s.name} className="flex size-11 items-center justify-center rounded-full bg-well text-[13px] font-semibold text-ink-2 no-underline hover:bg-accent-soft hover:text-accent-ink"><span aria-hidden>{initials(s.name)}</span><span className="sr-only">{s.name}</span></Link>
                  </li>
                ))}
                {follows.length > 8 && <li className="flex size-11 items-center justify-center rounded-full text-[13px] text-muted">+{follows.length - 8}</li>}
              </ul>
            ) : <p className="mt-1 text-[13px] text-muted">Bạn chưa theo dõi shop nào</p>}
          </section>
          <div className="panel flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-muted" aria-disabled="true">
            <span className="flex items-center gap-3 text-[14px]"><LogOut size={20} aria-hidden />Đăng xuất</span>
            <span className="text-[12px]">Không dùng trong bản demo</span>
          </div>
      </div>
    </div>
  )

  return web ? (
    <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-6 pb-12">
      <AccountNav />
      <div className="min-w-0"><PageTitle className="sr-only">Tôi</PageTitle>{content}</div>
    </div>
  ) : (
    <div className="pb-6"><PageTitle className="sr-only">Tôi</PageTitle>{content}</div>
  )
}

/** Shortcut tile: icon, label, one line of state. */
function Tile({ to, icon, label, value, sub }: { to: string; icon: ReactNode; label: string; value?: string; sub?: string }) {
  return (
    <li className="min-w-0">
      <Link to={to} className="flex h-full min-h-[64px] items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-ink no-underline hover:bg-well">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-well text-ink">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium">{label}</span>
          {(value || sub) && <span className="tabular block truncate text-[12px] text-muted">{value ?? sub}</span>}
        </span>
      </Link>
    </li>
  )
}

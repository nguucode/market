// Web account nav (US-ACC-001), shared by /me and /me/addresses.
import { NavLink } from 'react-router'
import { cx } from '@/components/ui'

const ITEMS: [string, string][] = [['Tổng quan', '/me'], ['Đơn mua', '/orders'], ['Kho voucher', '/vouchers'], ['Yêu thích', '/favorites'], ['Địa chỉ', '/me/addresses']]

export function AccountNav() {
  return (
    <nav aria-labelledby="account-nav" className="sticky top-[128px] self-start">
      <p id="account-nav" className="mb-2 px-3 text-[13px] font-semibold text-muted">Tài khoản của tôi</p>
      <ul className="space-y-0.5">
        {ITEMS.map(([label, to]) => (
          <li key={to}>
            <NavLink to={to} end className={({ isActive }) => cx('flex h-10 items-center rounded-full px-3 text-[14px] no-underline hover:bg-well', isActive ? 'bg-well font-semibold text-ink' : 'text-ink-2')}>{label}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

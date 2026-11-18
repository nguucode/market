// Web account nav (US-ACC-001), shared by /me and /me/addresses.
import { NavLink } from 'react-router'
import { cx } from '@/components/ui'

const ITEMS: [string, string][] = [['Tổng quan', '/me'], ['Đơn mua', '/orders'], ['Kho voucher', '/vouchers'], ['Yêu thích', '/favorites'], ['Địa chỉ', '/me/addresses']]

export function AccountNav() {
  return (
    <nav aria-labelledby="account-nav" className="panel sticky top-[128px] self-start p-2">
      <p id="account-nav" className="px-3 pt-2 pb-2 text-[14px] font-bold text-ink">Tài khoản của tôi</p>
      <ul className="space-y-0.5">
        {ITEMS.map(([label, to]) => (
          <li key={to}>
            <NavLink to={to} end className={({ isActive }) => cx('flex h-10 items-center rounded-[var(--radius-control)] px-3 text-[14px] no-underline', isActive ? 'bg-accent-soft font-semibold text-accent-ink' : 'text-ink-2 hover:bg-well hover:text-ink')}>{label}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

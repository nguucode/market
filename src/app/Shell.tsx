// US-FND-001: shell for both layouts, nav from spec/ia/sitemap.yaml. US-FND-011: legal footer.
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowLeft, Bell, ChevronDown, Grid2x2, Heart, Home, ShoppingBag, Smartphone, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { categoryRow, isTabRoot, screenFor, tabBar } from '@/app/sitemap'
import { cartCount, unreadCount, useWorld } from '@/app/store'
import { childrenOf } from '@/app/catalog'
import { cx, IconButton, SampleBadge, Toaster } from '@/components/ui'
import { DemoControlsButton, DemoControlsSheet } from '@/features/demo/DemoControls'
import { CategoryMenu } from '@/features/dsc/CategoryMenu'
import { SearchBox } from '@/features/dsc/SearchBox'

const TAB_ICON: Record<string, typeof Home> = { home: Home, categories: Grid2x2, favorites: Heart, notifications: Bell, me: User }

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Market, về trang chủ" className={cx('inline-flex shrink-0 items-center gap-2 no-underline', className)}>
      <img src="/icon.svg" alt="" width={28} height={28} className="size-7" />
      <span className="font-display text-[22px] leading-none font-semibold tracking-[-0.02em] text-ink">Market</span>
    </Link>
  )
}

/** Focus the page h1 and set the document title on route change (a11y). */
function useRouteFocus() {
  const { pathname } = useLocation()
  useEffect(() => {
    const s = screenFor(pathname)
    if (s && !s.title.startsWith('{')) document.title = `${s.title} · Market`
    else if (!s) document.title = 'Market'
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-page-title]')?.focus({ preventScroll: true }))
    window.scrollTo(0, 0)
  }, [pathname])
}

function Badge({ n, label }: { n: number; label: string }) {
  if (!n) return null
  return <span className="tabular absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-jade px-1 text-[11px] font-bold text-white" aria-label={`${n} ${label}`}>{n > 99 ? '99+' : n}</span>
}

function CartButton() {
  const w = useWorld()
  const n = cartCount(w)
  return (
    <Link to="/cart" aria-label={`Giỏ hàng${n ? `, ${n} sản phẩm` : ''}`} className="relative inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-well">
      <ShoppingBag size={22} strokeWidth={1.6} aria-hidden />
      <Badge n={n} label="sản phẩm" />
    </Link>
  )
}

/* ── Web ──────────────────────────────────────────────────────────── */

function AccountMenu() {
  const w = useWorld()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="inline-flex h-11 items-center gap-2 rounded-full pr-2 pl-1.5 hover:bg-well" aria-label="Tài khoản">
          <span className="flex size-8 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-ground">{w.buyer.avatarInitials}</span>
          <ChevronDown size={14} aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 w-60 rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-pop)] motion-safe:animate-[pop-in_160ms_var(--ease-out-expo)]">
          <div className="px-3 py-2.5"><p className="font-semibold">{w.buyer.name}</p><p className="text-[12px] text-muted">{w.buyer.phone}</p></div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          {[['Tôi', '/me'], ['Đơn mua', '/orders'], ['Kho voucher', '/vouchers'], ['Địa chỉ', '/me/addresses']].map(([l, to]) => (
            <DropdownMenu.Item key={to} asChild><Link to={to} className="flex h-10 items-center rounded-[10px] px-3 text-[14px] no-underline outline-none data-[highlighted]:bg-well">{l}</Link></DropdownMenu.Item>
          ))}
          <DropdownMenu.Item disabled className="flex h-10 items-center justify-between rounded-[10px] px-3 text-[14px] text-muted outline-none">Đăng xuất<span className="text-[11px]">Không dùng trong bản demo</span></DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function WebHeader({ focused }: { focused: boolean }) {
  const w = useWorld()
  const unread = unreadCount(w)
  const top = childrenOf(w).slice(0, 6)
  if (focused) return (
    <header className="border-b border-line bg-ground">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-8"><Wordmark /><span className="h-6 w-px bg-line" aria-hidden /><span className="text-[15px] font-medium text-ink-2">Thanh toán</span><span className="flex-1" /><SampleBadge /></div>
    </header>
  )
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/95 backdrop-blur-[6px] supports-[backdrop-filter]:bg-ground/85">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-4 px-8">
        <Wordmark />
        <CategoryMenu />
        <SearchBox className="flex-1" />
        <nav aria-label="Tài khoản và giỏ" className="flex items-center gap-0.5">
          <NavLink to="/notifications" className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-well" aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`}>
            <Bell size={21} strokeWidth={1.6} aria-hidden /><Badge n={unread} label="chưa đọc" />
          </NavLink>
          <NavLink to="/favorites" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-well" aria-label="Yêu thích"><Heart size={21} strokeWidth={1.6} aria-hidden /></NavLink>
          <CartButton />
          <AccountMenu />
        </nav>
      </div>
      <nav aria-label="Lối tắt" className="mx-auto flex h-11 max-w-[1440px] items-center gap-1 overflow-hidden px-6">
        {categoryRow.filter((c) => c.route).map((c) => (
          <NavLink key={c.id} to={c.route!} className={({ isActive }) => cx('flex h-8 items-center rounded-full px-3 text-[13px] font-medium no-underline whitespace-nowrap hover:bg-well', isActive && 'bg-well')}>{c.label}</NavLink>
        ))}
        <span className="mx-1 h-4 w-px bg-line" aria-hidden />
        {top.map((c) => <NavLink key={c.id} to={`/c/${c.slug}`} className={({ isActive }) => cx('flex h-8 items-center rounded-full px-3 text-[13px] no-underline whitespace-nowrap text-ink-2 hover:bg-well', isActive && 'bg-well text-ink')}>{c.name}</NavLink>)}
        <span className="flex-1" />
        <Link to={`/device?path=${encodeURIComponent(location.pathname + location.search)}`} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] no-underline text-ink-2 hover:bg-well"><Smartphone size={15} aria-hidden />Xem trên điện thoại</Link>
        <DemoControlsButton />
        <SampleBadge />
      </nav>
    </header>
  )
}

export function Footer() {
  const links: [string, string][] = [['Về Market', 've-market'], ['Điều khoản', 'dieu-khoan'], ['Chính sách bảo mật', 'bao-mat'], ['Quy chế hoạt động', 'quy-che'], ['Giải quyết khiếu nại', 'khieu-nai']]
  return (
    <footer className="mt-16 border-t border-line bg-ground">
      <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <nav aria-label="Thông tin pháp lý" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          {links.map(([l, s]) => <Link key={s} to={`/policies/${s}`} className="text-ink-2 hover:text-ink">{l}</Link>)}
        </nav>
        <p className="mt-4 max-w-[760px] text-[12px] leading-5 text-muted">
          Market là bản demo phục vụ case study, vận hành bởi Công ty TNHH Market Demo (pháp nhân hư cấu), 12 Bạch Đằng, Phường Hải Châu, Thành phố Đà Nẵng. Mã số doanh nghiệp 0400000000 (hư cấu). Mọi sản phẩm, shop, đơn hàng và thanh toán đều là dữ liệu mẫu.
        </p>
      </div>
    </footer>
  )
}

/* ── App ──────────────────────────────────────────────────────────── */

function AppHeader({ path }: { path: string }) {
  const nav = useNavigate()
  const s = screenFor(path)
  const [demo, setDemo] = useState(false)
  if (path === '/') return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ground/95 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2 backdrop-blur-[6px]">
      <div className="flex h-11 items-center gap-2"><Wordmark /><span className="flex-1" /><SampleBadge onClick={() => setDemo(true)} /><CartButton /></div>
      <SearchBox className="mt-1" />
      <DemoControlsSheet open={demo} onOpenChange={setDemo} />
    </header>
  )
  const root = isTabRoot(path)
  const title = s && !s.title.startsWith('{') ? s.title : ''
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-1 border-b border-line/70 bg-ground/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-[6px]">
      {!root ? <IconButton label="Quay lại" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))}><ArrowLeft size={22} aria-hidden /></IconButton> : <span className="w-2" />}
      <span className="min-w-0 flex-1 truncate text-[16px] font-semibold" aria-hidden>{title}</span>
      <SampleBadge onClick={() => setDemo(true)} />
      {path !== '/cart' && <CartButton />}
      <DemoControlsSheet open={demo} onOpenChange={setDemo} />
    </header>
  )
}

function TabBar() {
  const w = useWorld()
  const unread = unreadCount(w)
  return (
    <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 bg-surface pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-bar)]">
      {tabBar.map((t) => {
        const Icon = TAB_ICON[t.id] ?? Home
        return (
          <NavLink key={t.id} to={t.route!} end className={({ isActive }) => cx('relative flex h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] no-underline', isActive ? 'font-semibold text-ink' : 'text-muted')}>
            {({ isActive }) => (<>
              <Icon size={22} strokeWidth={isActive ? 2 : 1.6} aria-hidden />
              {t.label}
              {t.badge === 'unread' && unread > 0 && <span className="tabular absolute top-1.5 left-[calc(50%+6px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-jade px-1 text-[10px] font-bold text-white" aria-label={`${unread} chưa đọc`}>{unread}</span>}
            </>)}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function Shell() {
  const layout = useLayout()
  const { pathname } = useLocation()
  useRouteFocus()
  const s = screenFor(pathname)
  const focused = s?.shell === 'focused'
  const bare = s?.shell === 'none'
  if (bare) return <><Outlet /><Toaster /></>
  if (layout === 'web')
    return (
      <div className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">Bỏ qua đến nội dung</a>
        <WebHeader focused={focused} />
        <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-8 pt-6">
          <Outlet />
        </main>
        {!focused && <Footer />}
        <Toaster />
      </div>
    )
  const tabs = isTabRoot(pathname)
  return (
    <div className={cx('min-h-dvh', tabs && 'pb-[calc(58px+env(safe-area-inset-bottom))]')}>
      <AppHeader path={pathname} />
      <main id="main" className="px-4 pt-4">
        <Outlet />
      </main>
      {(pathname === '/' || pathname === '/me') && <Footer />}
      {tabs && <TabBar />}
      <Toaster />
    </div>
  )
}

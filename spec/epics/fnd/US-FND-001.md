---
id: US-FND-001
title: App shell for both layouts with nav from sitemap.yaml
epic: FND
priority: P0
status: Draft
size: M
routes: ["/", "/categories", "/favorites", "/notifications", "/me"]
dependsOn: []
---

## Story

As a buyer, I want the same navigation to be in the place my device expects, a header with search on the laptop and a tab bar on the phone, so that I can reach any part of Market without learning two apps.

## Acceptance criteria

- Given a viewport ≥ 1024px, then the header shows, left to right, the logo (→ `/`), "Danh mục" (opens the category tree menu), the search pill with placeholder "Tìm sản phẩm, shop…", "Thông báo", "Yêu thích", "Giỏ hàng", "Tài khoản", then the demo items "Xem trên điện thoại" and "Demo controls"; under it the category row shows "Flash sale", "Mã giảm giá", "Shop chính hãng" and the top 6 level-1 categories, in that order, all read from `sitemap.yaml` (`header`, `categoryRow`).
- Given a viewport < 1024px on a tab route (`/`, `/categories`, `/favorites`, `/notifications`, `/me`), then a bottom tab bar shows "Trang chủ", "Danh mục", "Yêu thích", "Thông báo", "Tôi" from `sitemap.yaml#tabBar` with the current tab marked; on any deeper route (for example `/p/:slug`, `/cart`) the tab bar is hidden and the screen header shows back, the screen title from `sitemap.yaml`, and the cart icon.
- Given the app layout on `/`, then the screen header shows the logo, a search pill that opens `/search`, and the cart icon instead of a title.
- Given the cart has lines, then "Giỏ hàng" carries a badge with the line count (`badge: lineCount`); given there are unread notifications, then "Thông báo" carries a badge with the unread count, shown as "99+" above 99 (`badge: unread`); a zero count shows no badge.
- Given I resize across 1024px, then the layout switches without a reload, the route and scroll position stay, and any open menu closes.
- Given a screen has `shell: focused` (`/checkout`, `/checkout/pay/:paymentId`, `/checkout/result/:paymentId`), then the web header is reduced to the logo and the page title with no search, category row or footer, and the app shows back + title with no tab bar; given `shell: none` (`/device`, `/orders/:id/invoice`), then no shell renders.
- Given "Tài khoản" is opened on web, then its menu lists "Đơn mua" (→ `/orders`), "Kho voucher" (→ `/vouchers`), "Địa chỉ" (→ `/me/addresses`) and "Đăng xuất", which is disabled with the line "Không dùng trong bản demo".

## UI states

- Empty: not applicable; the shell always renders. Badges are hidden at zero.
- Loading: the shell renders immediately from the sitemap; badges appear when the store resolves (no badge placeholder, no layout shift).
- Error: if a screen throws, the error boundary from US-FND-006 replaces the content area only; header, category row and tab bar stay usable.
- Unavailable: none.
- Overflow: at 1024px the search pill shrinks first (min 280px) and the category row drops trailing categories into "Xem thêm" rather than wrapping; long category names ("Điện thoại & Phụ kiện") never truncate mid-word. App screen titles with a 120-character product name truncate to one line with "…". Badge "99+" fits a 20px pill.

## Design notes

- Web (≥ 1024): header 72px on the warm paper background, no bottom shadow, a 1px ink-at-10% hairline. Search pill 48px tall with a 2px ink border takes most of the width; the brand colour appears only on the logo and the round search button inside the pill. Icon actions are 48px targets with the label under the icon at 12px. Category row 44px, sans 14px links, no pills, editorial tone as in the reference study. Content max-width 1440 centred.
- App (< 1024): tab bar 56px plus safe-area inset, five icon + 11px label items, active item in ink with a 2px top bar, inactive at 60% ink. Per-screen header 52px: back chevron, serif title 18px, cart icon right. Home header: logo, search pill (40px), cart.
- Demo items ("Xem trên điện thoại", "Demo controls") sit at the right end of the web header in a muted neutral style with a small "Demo" tag so they never read as product features. In the app layout they are not in the shell; demo controls open from the "Dữ liệu mẫu" badge (US-FND-009, US-FND-004).

## FE notes

- `src/nav/sitemap.ts` imports `spec/ia/sitemap.yaml` at build time (Vite yaml plugin) and exposes typed `header`, `categoryRow`, `tabBar`, `screens`; a Vitest test fails if any `route` in nav is not a screen route.
- `useLayout()` from `matchMedia('(min-width: 1024px)')`; layout never comes from the route or user agent.
- `resolveScreen(pathname)` (pure, TDD): matches `screens[].route` patterns (`/p/:slug`, `*` last) and returns `{ id, title, shell, isTabRoute }`; drives header title, focused/none shells and tab bar visibility.
- `categoryRow.top-cats` resolves to the first 6 level-1 categories by `sortOrder` from the store (US-FND-003).
- Badges: `selectCartLineCount`, `selectUnreadCount` (US-NTF-002 writes notifications); `formatBadge(n)` → `''`, `'1'…'99'`, `'99+'` (pure, TDD).
- `<html lang="vi">`; tab bar is a `<nav aria-label="Điều hướng chính">` with `aria-current="page"`.

## Mock data

- Ten level-1 categories from mock-data.md#scale; the persona's seeded cart lines (3 shops, including the delisted and out-of-stock lines) give a non-zero cart badge; 6 unread notifications give the "6" bell badge.

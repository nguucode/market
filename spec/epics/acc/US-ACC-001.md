---
id: US-ACC-001
title: Me page and account menu
epic: ACC
priority: P0
status: Draft
size: M
routes: ["/me"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a buyer, I want one place that shows my orders by status, my vouchers, favourites, followed shops, and addresses, so that I can jump to whatever needs my attention after buying.

## Acceptance criteria

- Given I open `/me` (tab "Tôi" on app, account menu → overview on web), then the profile header shows the avatar, "Lê Thu Hà", and the masked phone "0905 *** 456".
- Given the "Đơn mua" block, then it shows the link "Xem lịch sử mua hàng" (`/orders`) and four shortcuts with counts: "Chờ thanh toán" (`/orders?status=awaiting_payment`), "Chờ lấy hàng" (`to_confirm` + `to_ship`, `/orders?status=to_ship`), "Đang giao" (`/orders?status=shipping`), "Đã giao" (`/orders?status=delivered`); a count of 0 shows no badge; counts over 99 show "99+".
- Given the menu rows, then I see "Kho voucher" with the number of saved usable vouchers (`/vouchers`), "Yêu thích" with the number of favourite products (`/favorites`), "Địa chỉ của tôi" (`/me/addresses`) with the default address one-line preview, and "Trung tâm trợ giúp" linking to `/policies/khieu-nai`.
- Given I follow shops, then a "Shop đang theo dõi" row shows their avatars (up to 8, then "+{n}") each linking to `/s/:handle`; with none, the row reads "Bạn chưa theo dõi shop nào".
- Given the web header, when I open "Tài khoản", then the menu lists "Đơn mua", "Kho voucher", "Địa chỉ", "Đăng xuất" (sitemap.yaml) and the name links to `/me`.
- Then "Đăng xuất" is shown disabled with the hint "Không dùng trong bản demo" (rules.md#decisions-from-story-writing-2026-11-18), because the demo has one signed-in persona.
- Given an order changes status via demo controls, then the counts update without reload.

## UI states

- Empty: a new seed with no orders shows the shortcuts with no badges and "Bạn chưa có đơn hàng nào" under "Đơn mua".
- Loading: header and block skeletons (US-FND-009).
- Error: "Không tải được thông tin tài khoản." with "Thử lại".
- Unavailable: none.
- Overflow: counts "99+"; a 40-character followed shop name never shows (avatars only, name in `aria-label`); the default address preview truncates to one line.

## Design notes

- Web (≥ 1024): two columns: a 240px left account nav (Tài khoản của tôi: Tổng quan, Đơn mua, Kho voucher, Yêu thích, Địa chỉ) and the overview content with the same blocks as app, laid out as a serif page title "Tôi", the orders block full width, then a 2-column grid of the other blocks. The account nav is reused by `/me/addresses`.
- App (< 1024): tab "Tôi" active; a paper header with avatar and name, then stacked blocks; the order shortcuts as four icon tiles in one row; menu rows full width with chevrons.
- Badges use ink on a pale warm pill, not red.

## FE notes

- Route `/me`, page `MePage`; `AccountNav` component shared with US-ACC-002 on web.
- Selectors: `selectOrderCountsByTab`, `selectUsableSavedVoucherCount(now)`, `selectFavoriteCount`, `selectFollowedShops`, `selectDefaultAddress`.
- Pure function, TDD: `orderTabCounts(orders)` mapping `to_confirm` into "Chờ lấy hàng" as object-model.md#enums states.
- Enhanced by ACC P1: Xu balance and history on Me; Followed shops tab on `/favorites`.

## Mock data

- Persona Lê Thu Hà with ~25 orders covering every status (ia/mock-data.md), saved vouchers, 12 favourites, 5 followed shops, two addresses.

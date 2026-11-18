---
id: US-PDP-006
title: Shop card and more from this shop
epic: PDP
priority: P0
status: Draft
size: S
routes: ["/p/:slug"]
dependsOn: [US-PDP-001, US-FND-007]
---

## Story

As a buyer, I want to see who sells this product, how reliable they are, and what else they sell, so that I can trust the shop and maybe add a second item from it.

## Acceptance criteria

- Given the product page, then the shop card shows the avatar, shop name, "Shop chính hãng" badge when `isOfficial`, location, rating with count ("4,9 ★ (12,3k)"), "{n} sản phẩm", "Tỉ lệ phản hồi {n}%", "Phản hồi {responseTime}", "Tham gia {dd/mm/yyyy}", and an outline pill "Xem shop" to `/s/:handle`.
- Given the card, then a collapsed section "Thông tin người bán" sits under it; expanding shows "Tên doanh nghiệp", "Địa chỉ kinh doanh", "Mã số doanh nghiệp" with the shop's fictional values and the badge "Đã xác thực" (rules.md#seller-and-product-disclosures).
- Given the shop has other active products, then a rail "Sản phẩm khác của Shop" shows up to 10 of them by `soldCount` (this product excluded) as product cards, with "Xem tất cả" to `/s/:handle?tab=products`.
- Given the shop has no other active product, then the rail is not rendered.
- Given I tap the shop name or avatar, then I go to `/s/:handle`, same as "Xem shop".

## UI states

- Empty: no other products → rail hidden; missing `responseTime` → that item hidden, never "undefined".
- Loading: card skeleton (avatar circle + 3 lines) and 4 card skeletons in the rail.
- Error: shop fails to load → card shows "Không tải được thông tin shop" with "Thử lại"; the rest of the page stays.
- Unavailable: delisted products never appear in the rail; sold-out ones appear with "Hết hàng".
- Overflow: the 40-character shop name truncates on one line; "Địa chỉ kinh doanh" with a long street wraps freely inside the expanded section.

## Design notes

- Web (≥ 1024): full-width section under the two columns: avatar 64px, name serif 20px, trust facts as a row of label/value pairs separated by dots, "Xem shop" on the right. "Thông tin người bán" is a disclosure row with chevron. Rail of cards below (5 visible at 1440).
- App (< 1024): compact card with avatar 48px, name, badge, and a 3-column fact row (rating, products, response rate); "Xem shop" pill top-right. Rail scrolls horizontally with peek.
- Trust signals in ink and muted text only; the official badge is a small ink pill with a check, not a coloured ribbon.

## FE notes

- `ShopCard` and `SellerInfo` components; `SellerInfo` is reused by US-SHP-004.
- Disclosure uses a native `<details>`/`<summary>` or a button with `aria-expanded` and controlled region.
- Pure, TDD: `moreFromShop(products, shopId, excludeId, n = 10)`.
- Counts and dates through US-FND-002.

## Mock data

- An official shop with full trust data, a regular shop with `responseTime` missing, a shop with only one product (no rail), and the 40-character shop name.
- Every shop carries `legalName`, `businessAddress`, and a fictional 10-digit `businessCode`.

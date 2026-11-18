---
id: US-CRT-001
title: Cart grouped by shop
epic: CRT
priority: P0
status: Draft
size: M
routes: ["/cart"]
dependsOn: [US-FND-001, US-FND-003, US-FND-002, US-FND-009]
---

## Story

As a buyer with products from several shops in my cart, I want the cart grouped by shop with each shop's shipping estimate and delivery date, so that I can see that each shop ships its own parcel before I decide what to buy.

## Acceptance criteria

- Given my cart has lines from three shops, when I open `/cart`, then I see the title "Giỏ hàng" and one group per shop, ordered by the most recently added line in that group (newest first), lines inside a group also newest first.
- Given a shop group, then its header shows the shop name linking to `/s/:handle`, a "Shop chính hãng" badge when `isOfficial`, and the group lists each line with image (4:5), product name, the SKU chip "Phân loại: Đen, 11oz" (omitted for products without dimensions), unit price, quantity, and line total.
- Given a line whose SKU has `priceBeforePromo`, then the unit price shows in the deal colour with the struck-through `priceBeforePromo` next to it (rules.md#price-display); no percent badge inside the cart.
- Given a shop group, then its footer shows "Phí vận chuyển dự kiến 22.000₫ · Nhận hàng 21/11 – 23/11", computed for my default address and that shop's default option "Nhanh" (rules.md#shipping); when I have no address, the footer reads "Phí vận chuyển tính ở bước Thanh toán".
- Given a shop has `codEnabled: false`, then its group header shows the muted note "Shop không hỗ trợ Thanh toán khi nhận hàng" (rules.md#payment), so the buyer learns it before checkout.
- Given the cart changes anywhere (here, PDP, Buy again), then the header and tab-bar cart badge show the number of lines (sitemap `badge: lineCount`), not units.
- Given the cart holds both available and unavailable lines, then available lines render in shop groups and unavailable ones move to the group defined in US-CRT-004.

## UI states

- Empty: illustration-free empty state from US-FND-009 with "Giỏ hàng của bạn còn trống" and a black pill "Mua sắm ngay" to `/`.
- Loading: one shop-group skeleton with three line rows, and the totals column/bar as a grey block; mock latency from US-FND-003.
- Error: "Không tải được giỏ hàng." with "Thử lại" (US-FND-009); the badge keeps the last known count.
- Unavailable: delisted, out-of-stock, and changed lines are handled in US-CRT-004; a shop whose products are all unavailable shows no shop group.
- Overflow: the 120-character product name clamps to two lines on web and app; the 40-character shop name truncates with an ellipsis before the badge; `12.499.000₫` line totals never wrap (name gives way first); a cart of 8 shops and 30 lines scrolls with the shop header sticky inside its group on app.

## Design notes

- Web (≥ 1024): two columns inside the 1440 container. Left column (fluid) holds the shop groups as plain sections on the paper background with a hairline divider between groups, no card borders, following the reference study cart. Line row: 96px image, name and SKU chip stacked, quantity stepper, line total right-aligned. Right column 360px, sticky at the top offset of the header, holds the totals (US-CRT-002).
- App (< 1024): back + "Giỏ hàng" header, tab bar hidden. Shop groups stack full width with a 8px paper gap between them; line row with a 72px image. The totals live in a sticky bottom bar (US-CRT-002).
- Headings for shop names use the sans body face at 16px semibold; the serif is kept for the page title on web only. Prices use the single deal colour, never red.

## FE notes

- Route `/cart`, page `CartPage`, components `CartShopGroup`, `CartLineRow`, `ShopGroupFooter`.
- Store: `cart.lines` (flat CartLine records), selectors `selectCartLineCount`, `selectCartView`.
- Pure functions, TDD in `src/lib/pricing/`: `groupCartByShop(lines, catalog)` (grouping and ordering rules above), `lineUnitPrice(sku, flashItem, qty)` shared with US-CRT-004, and `shippingQuote(shop, address, option, weightGrams)` reading the fixed table from mock data. Money only through the US-FND-002 formatter.
- The shipping estimate here is display-only; the binding fee is computed at checkout (US-CHK-003) by the same `shippingQuote`.

## Mock data

- The seeded cart from ia/mock-data.md: three shops, one with a shop voucher just below its minimum, one with COD off, plus a delisted product and an out-of-stock SKU.
- The 120-character product name and 40-character shop name sit in the cart; one line priced `12.499.000₫`.
- Persona default address in Đà Nẵng so shops in Đà Nẵng, Hà Nội, and TP.HCM give three different shipping estimates.

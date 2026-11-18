---
id: US-PDP-002
title: Price block with sale, range, and flash-sale price
epic: PDP
priority: P0
status: Draft
size: S
routes: ["/p/:slug"]
dependsOn: [US-PDP-001, US-FND-002]
---

## Story

As a buyer, I want one honest price block that tells me what I pay now, what it was before the promotion, and whether a flash sale applies to me, so that I trust the deal without doing the maths.

## Acceptance criteria

- Given every SKU has the same price and none is in a promotion, then the block shows the price alone, e.g. "189.000₫" (rules.md#spec-conventions).
- Given SKU prices differ and no full combination is picked, then the block shows the range of current prices "189.000₫ – 249.000₫" with no struck-through price; if any SKU is discounted it adds the label "Giảm đến {NN}%" using the largest discount (rules.md#price-display). Once a full combination is picked (US-PDP-003), the block shows that SKU's price only.
- Given the shown SKU has `priceBeforePromo`, then the block shows the current price in the deal colour, `priceBeforePromo` struck through, and the badge "-{NN}%" where NN = floor((before − price) / before × 100); the struck price is never any other field (rules.md#price-display).
- Given a SKU whose `priceBeforePromo` would make the discount exceed 50%, then the struck price and badge are not shown (current price only) and a dev-only console warning names the SKU; the mock seed test fails on such data (rules.md#price-display).
- Given the product has a SKU in the active flash-sale slot, then a "Flash sale" row sits above the price with "Kết thúc sau {hh:mm:ss}" ticking each second, the slot price replaces that SKU's price in the block, and the line "Giá Flash sale áp dụng cho tối đa {perBuyerLimit} sản phẩm mỗi khách" shows under it; beyond that quantity the normal price applies (rules.md#price-display, quantity note in US-PDP-004).
- Given the slot ends while I am on the page, then the row disappears and the block re-renders with the normal price without a reload.
- Given every price, then it includes VAT and fees; the block shows no VAT line (rules.md#price-display).

## UI states

- Empty: none (an active product always has at least one SKU price).
- Loading: one skeleton line 24px high.
- Error: none beyond the page error (US-PDP-001).
- Unavailable: delisted → block hidden (US-PDP-001). Flash-sale quota sold out for that SKU → the row reads "Flash sale đã hết suất" and the normal price shows.
- Overflow: an 11-character price "12.499.000₫" plus a struck "12.999.000₫" and "-3%" fit on one line at 375px by dropping the badge to a second line; a range of two 11-character prices wraps after the dash.

## Design notes

- Web (≥ 1024): current price 28px bold sans in ink (deal colour when discounted), struck price 14px muted, badge as a small pill in the deal-colour tint. The flash-sale row is a single quiet band above the price: label "Flash sale" in the deal colour, the countdown as plain text, never a flashing banner (research §7.2).
- App (< 1024): same block directly under the gallery, price 24px; the flash-sale row spans the screen width as a thin band.
- The deal colour is the one from DESIGN.md (not red, not orange).

## FE notes

- Pure, TDD (price maths is always TDD): `priceView({ skus, selectedSkuId, flashItems, now })` → `{ kind: 'single' | 'range', price, min, max, before?, discountPct?, maxDiscountPct?, flash?: { endsAt, limit, soldOut } }`; `discountPct(price, before)` with floor and the 50% guard returning null above it.
- Flash price for a SKU applies only when `now` is inside the slot and `sold < quota`.
- Countdown uses one shared `useNow(1000)` tick; formatting `hh:mm:ss` via US-FND-002.
- `priceView` is shared with the product card (US-FND-007) and search sorting (US-DSC-004).

## Mock data

- A single-price product (189.000₫), a product with a range (189.000₫ – 249.000₫) where two SKUs carry `priceBeforePromo`, a SKU at exactly 50% off (shown), one deliberately invalid fixture used only in the unit test (51%), and a product in the current flash-sale slot with `perBuyerLimit: 2`.
- Demo control "start the next flash-sale slot" (mock-data.md) to show the row appear.

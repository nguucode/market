---
id: US-PDP-004
title: Add to cart and Buy now
epic: PDP
priority: P0
status: Draft
size: M
routes: ["/p/:slug"]
dependsOn: [US-PDP-003, US-FND-008, US-FND-010, US-CHK-001]
---

## Story

As a buyer who has picked a Phân loại, I want to add it to my cart or buy it straight away, so that I can keep shopping across shops or check out this one item now.

## Acceptance criteria

- Given the web layout, then the right column shows "Số lượng" with a − / + stepper (min 1, max the SKU stock), then two pills: "Mua ngay" (black, primary) and "Thêm vào giỏ" (outline).
- Given the app layout, then a sticky bottom bar holds "Thêm vào giỏ" and "Mua ngay"; tapping either opens the variant sheet (SKU image, price block, picker, "Số lượng", and one confirm pill labelled with the action I tapped), even for a zero-dimension product, so quantity is always chosen in the sheet.
- Given no full combination is picked, when I press either action, then on web the picker rows show "Vui lòng chọn Phân loại hàng" and focus moves to the first unpicked row; on app the sheet's confirm pill is disabled with the same line above it.
- Given a full combination is picked, when I press "Thêm vào giỏ", then the line is added (or its quantity increased if that SKU is already in the cart), the cart badge updates, and the toast "Đã thêm vào Giỏ hàng" shows with the action "Xem giỏ hàng" (US-FND-010); the app sheet closes.
- Given the SKU is already in my cart, when the new total would exceed stock, then nothing is added and the message reads "Bạn đã có {n} sản phẩm này trong giỏ hàng. Không thể thêm số lượng đã chọn vì vượt quá số lượng còn hàng."
- Given a full combination is picked, when I press "Mua ngay", then I go to `/checkout` with a session holding only this SKU and quantity; my cart lines and their selection are not changed (US-CHK-001).
- Given the SKU has an active flash-sale price and the quantity exceeds `perBuyerLimit`, then under the stepper the note "{k} sản phẩm đầu tiên giá Flash sale, các sản phẩm còn lại tính giá thường" shows (rules.md#price-display).
- Given the product is sold out or delisted, then both actions are replaced by one disabled pill "Hết hàng" or "Sản phẩm đã ngừng bán".

## UI states

- Empty: none.
- Loading: the add action shows a spinner inside the pill for the mock latency and is not double-submittable.
- Error: the store rejects the add (stock changed meanwhile) → toast "Sản phẩm vừa thay đổi số lượng còn hàng. Vui lòng chọn lại." and the picker re-reads stock.
- Unavailable: sold out, delisted, and the over-stock case above.
- Overflow: quantity 3 digits (stock up to 999) fits the stepper; the toast truncates a 120-character name to one line; the app bar keeps both pills equal width at 375px.

## Design notes

- Web (≥ 1024): pills 48px high, full width of the right column, "Mua ngay" above "Thêm vào giỏ" (the reference study puts the black pill first). Stepper 36px with pill ends.
- App (< 1024): bottom bar 64px plus safe-area inset, paper background with a hairline top border; "Thêm vào giỏ" outline pill and "Mua ngay" black pill side by side. The variant sheet is a bottom sheet (US-FND-008) at up to 85% height, the confirm pill sticky at its bottom.
- No chat button in P0 (sitemap.yaml marks chat P1); the bar does not leave a gap for it.

## FE notes

- Store actions: `cart.add(skuId, qty)` → `{ ok } | { ok: false, reason: 'over_stock' | 'stock_changed', inCart }`; `checkout.startBuyNow({ skuId, qty })` creates a checkout session with `source: 'buy_now'` that US-CHK-001 reads instead of the cart selection.
- Pure, TDD: `clampQty(qty, stock, inCart)`, `flashSplit(qty, perBuyerLimit, alreadyBought)` → `{ flashQty, normalQty }` (the same split the cart uses, rules.md#price-display).
- Selection shared with the inline picker through `useSkuSelection` (US-PDP-003).
- Enhanced by PDP P1: Chat with the shop.

## Mock data

- The persona's cart already holds 2 of one SKU with stock 3 (over-stock message on adding 2 more).
- A flash-sale SKU with `perBuyerLimit: 2` for the split note at quantity 3.
- Demo flow: pick a SKU, "Thêm vào giỏ", then "Mua ngay" on another product from a different shop.

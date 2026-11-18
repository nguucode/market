---
id: US-CRT-002
title: Select lines and the totals bar
epic: CRT
priority: P0
status: Draft
size: M
routes: ["/cart"]
dependsOn: [US-CRT-001]
---

## Story

As a buyer, I want to pick which lines and shops I buy now and see the total and my savings update as I pick, so that I can buy part of my cart without surprises at checkout.

## Acceptance criteria

- Given each available line, then it has a checkbox; each shop header has a checkbox that selects or clears all available lines of that shop and shows the mixed state when only some are selected; the totals area has "Chọn tất cả ({n})" where n is the number of available lines.
- Given I change any selection, then the totals area shows "Tổng cộng ({k} sản phẩm): {total}₫", where k is the number of selected lines and total is Σ goods − Σ applied shop vouchers of the selected lines, and below it "Tiết kiệm {x}₫" in the deal colour, where x is Σ (`priceBeforePromo` − price) × qty plus the applied shop vouchers. The savings line is hidden when x is 0.
- Given at least one line is selected, when I press the black pill "Mua hàng ({k})", then I go to `/checkout` with exactly the selected lines; given none is selected, the button stays enabled and pressing it shows the toast "Bạn chưa chọn sản phẩm nào để mua.".
- Given a newly added line (from PDP or Buy again), then it starts selected; my selection persists across reloads because `selected` lives on the CartLine (object-model.md).
- Given deselecting a line drops a shop below its voucher's `minSpend`, then that voucher is removed with the inline note from US-CRT-005 and the totals update in the same frame (rules.md#voucher-math item 6).
- Given an unavailable line (US-CRT-004), then its checkbox is disabled and it is excluded from "Chọn tất cả", the count, and the total.
- Given the cart total here, then it equals the goods-minus-shop-voucher subtotal that US-CHK-001 shows for the same selection, to the đồng.

## UI states

- Empty: nothing selected → "Tổng cộng (0 sản phẩm): 0₫", savings hidden.
- Loading: while a quantity or selection change is saving, the total keeps the optimistic value and shows no spinner; a failed save reverts the selection with the toast "Không cập nhật được giỏ hàng. Thử lại.".
- Error: as in US-CRT-001.
- Unavailable: only unavailable lines left → "Chọn tất cả" is disabled and the CTA shows the toast above.
- Overflow: totals up to 13 characters (`112.499.000₫`) fit the web column and the app bar; on app at 375 px the savings line drops under the total rather than truncating.

## Design notes

- Web (≥ 1024): sticky right column, 360px. Rows: "Tiền hàng", "Voucher của Shop" (negative, deal colour), a hairline, "Tổng cộng ({k} sản phẩm)" in 20px bold, "Tiết kiệm {x}₫", then the full-width 48px black pill "Mua hàng ({k})". "Chọn tất cả" sits above the first shop group, not in the column.
- App (< 1024): sticky bottom bar 64px above the safe area: "Chọn tất cả" checkbox left, total and savings stacked right-aligned, black pill "Mua hàng ({k})" at the right edge. The bar has the soft warm shadow from the reference study.
- Checkbox uses the ink colour, 20px, 44px hit area.

## FE notes

- Components `CartTotals` (web column) and `CartBottomBar` (app); one selector feeds both.
- Store actions `cart.toggleLine(id)`, `cart.toggleShop(shopId)`, `cart.toggleAll()`; each persists `selected`.
- Pure functions, TDD in `src/lib/pricing/`: `cartSummary(groups, appliedShopVouchers)` → `{ selectedCount, goods, shopDiscount, total, savings }`. It calls the same `shopVoucherDiscount` that `priceCheckout` uses (US-CHK-001), and a shared test asserts cart `total` equals checkout Σ shop `net` for the seeded cart.
- Navigation passes no query string; checkout reads selected lines from the store.

## Mock data

- Seeded three-shop cart with about 40% of SKUs carrying `priceBeforePromo`, so "Tiết kiệm" is non-zero on load.
- One shop whose voucher minimum is met only when all its lines are selected, to show removal on deselect.

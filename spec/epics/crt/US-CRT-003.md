---
id: US-CRT-003
title: Change quantity, change variant, and remove
epic: CRT
priority: P0
status: Draft
size: M
routes: ["/cart"]
dependsOn: [US-CRT-001, US-FND-008, US-FND-010, US-PDP-003]
---

## Story

As a buyer, I want to change quantity and variant or remove a line right in the cart, so that I fix the cart without going back to each product page.

## Acceptance criteria

- Given a line, then its quantity stepper ranges from 1 to the SKU's current stock; "+" is disabled at stock and its tooltip/helper reads "Chỉ còn {n} sản phẩm"; typing a larger number clamps to stock with the same helper.
- Given the quantity is 1, when I press "−", then the remove-confirm dialog opens (US-FND-010) with "Bạn chắc chắn muốn bỏ sản phẩm này?" and the buttons "Không" and "Đồng ý"; "Đồng ý" removes the line and shows the toast "Đã xóa sản phẩm khỏi giỏ hàng".
- Given a line, when I press "Xóa", then the same dialog opens; given I removed the last line of a shop, then the shop group disappears.
- Given a product with dimensions, when I tap the SKU chip "Phân loại: Đen, 11oz ▾", then the variant picker from US-PDP-003 opens in the variant sheet (app) or a popover anchored to the chip (web), preselected with the current SKU, with out-of-stock combinations disabled; "Xác nhận" replaces the SKU on the line and keeps quantity clamped to the new stock.
- Given I pick a SKU that already has its own line, then the two lines merge into one with summed quantity, clamped to stock, and the toast "Đã gộp với sản phẩm cùng phân loại trong giỏ".
- Given any quantity or SKU change, then the line total, the totals bar (US-CRT-002), and the shop voucher eligibility (US-CRT-005) update; a shop voucher that stops holding is removed with its inline note (rules.md#voucher-math item 6).
- Given a flash-sale SKU, when quantity goes above `perBuyerLimit`, then the line shows the split price note from US-CRT-004 instead of blocking.

## UI states

- Empty: removing the last line shows the US-CRT-001 empty state.
- Loading: the stepper value updates at once; the store write is debounced 300 ms; the variant sheet shows the picker skeleton from US-PDP-003 while SKUs load.
- Error: a failed write reverts the value with "Không cập nhật được số lượng. Thử lại." (toast); a failed remove keeps the line and shows "Không xóa được sản phẩm. Thử lại.".
- Unavailable: a SKU that went out of stock while the sheet was open is disabled on "Xác nhận" with "Phân loại này vừa hết hàng".
- Overflow: SKU chip with two long option names ("Phân loại: Xanh rêu đậm, XXL dáng rộng") truncates inside the chip; quantity up to 3 digits fits the stepper.

## Design notes

- Web (≥ 1024): stepper is a 36px pill with "−" value "+"; "Xóa" is a text button under the price, muted ink. Variant edit opens a 360px popover with the chip picker and a black pill "Xác nhận".
- App (< 1024): stepper 32px; "Xóa" sits on the line as a text button (no swipe gesture, so it stays discoverable); variant edit is a bottom sheet (US-FND-008) with the product thumbnail, price for the chosen SKU, chips, and a full-width black pill "Xác nhận".
- Confirm dialog: neutral ink, the destructive action is not red; it uses the black pill for "Đồng ý" and an outline pill for "Không".

## FE notes

- Components `QtyStepper`, `CartVariantEditor` (wraps `VariantPicker` from US-PDP-003), confirm via `useConfirm` (US-FND-010).
- Store actions `cart.setQty(id, qty)`, `cart.changeSku(id, skuId)`, `cart.remove(id)`.
- Pure functions, TDD: `clampQty(qty, stock)` and `mergeLines(lines, lineId, newSkuId)` (merge rule and clamp). Price effects come from `lineUnitPrice` and `cartSummary`, not recomputed here.

## Mock data

- The product with 2 dimensions × 6 options where some combinations are out of stock and one option has no stock at all (ia/mock-data.md) sits in the cart.
- A cart line with stock 2 to show the "Chỉ còn 2 sản phẩm" clamp.
- Two lines of the same product with different SKUs, to demonstrate the merge.

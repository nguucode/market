---
id: US-CRT-004
title: Unavailable and changed lines
epic: CRT
priority: P0
status: Draft
size: S
routes: ["/cart"]
dependsOn: [US-CRT-001]
---

## Story

As a buyer, I want the cart to tell me plainly which lines can no longer be bought or have changed since I added them, so that the price I see is the price I pay and nothing disappears silently.

## Acceptance criteria

- Given a line whose product is `delisted`, then it moves to a bottom group "Sản phẩm không khả dụng" with the reason "Sản phẩm không còn bán", greyed image, no checkbox, and "Xóa"; the group header has "Xóa tất cả" which asks once with the US-FND-010 confirm ("Xóa {n} sản phẩm không khả dụng?").
- Given a line whose SKU has stock 0, then it moves to the same group with "Hết hàng"; when the product has other SKUs in stock, the line also offers "Chọn phân loại khác", which opens the US-CRT-003 variant editor and, on confirm, moves the line back to its shop group.
- Given a line whose quantity exceeds current stock (stock > 0), then it stays available, its quantity is clamped to stock, and the line shows "Chỉ còn {n} sản phẩm. Đã cập nhật số lượng."
- Given a line whose current unit price differs from `priceAtAdd`, then the line shows the note "Giá đã thay đổi từ 189.000₫" under the price, and the totals use the current price; the note clears once the line is part of a placed order or the buyer removes it.
- Given a flash-sale line with quantity above the slot `perBuyerLimit`, then the line shows "{n} sản phẩm giá Flash sale, {m} sản phẩm giá thường" and the line total is n × slot price + m × normal price (rules.md#price-display).
- Given a flash-sale slot ends while the line is in the cart, then the line reprices to the normal price and shows the "Giá đã thay đổi từ …" note.
- Given any line becomes unavailable, then it is deselected and any shop voucher that stops holding is removed with its inline note (rules.md#voucher-math item 6).

## UI states

- Empty: if every line is unavailable, the shop groups are gone, only "Sản phẩm không khả dụng" shows, and the totals read 0₫.
- Loading: availability is derived from the store on render; no extra spinner.
- Error: as in US-CRT-001.
- Unavailable: this story is the unavailable state; the three reasons are "Sản phẩm không còn bán", "Hết hàng", and (for a whole product with no stock in any SKU) "Hết hàng" without "Chọn phân loại khác".
- Overflow: a note and a flash-sale split on the same line stack as two muted lines, never truncated; ten unavailable lines collapse after three with "Xem thêm {n} sản phẩm".

## Design notes

- Web (≥ 1024): the unavailable group sits below all shop groups with a hairline and the serif-free 16px heading; lines at 50% image opacity, text in the secondary ink; notes for changed price use the secondary ink, not the deal colour and not red, because it is a fact.
- App (< 1024): same group at the bottom of the list, above the sticky bar; "Xóa tất cả" right-aligned in the group header.

## FE notes

- Pure functions, TDD in `src/lib/pricing/`: `lineAvailability(line, product, sku)` → `available | delisted | out_of_stock` plus `{ clampedQty?, priceChangedFrom? }`; `lineUnitPrice(sku, flashItem, qty)` → `{ flashUnits, normalUnits, total }`. Tests cover each case above, including a slot ending mid-session.
- `CartLine` needs `priceAtAdd` (set by the add-to-cart action in US-PDP-004) in addition to the fields in object-model.md.
- Clamping writes back to the store once, so the "Đã cập nhật số lượng" note is not shown again on the next visit.

## Mock data

- The delisted product and the out-of-stock SKU already in the seeded cart (ia/mock-data.md).
- One line with `priceAtAdd` 189.000₫ and a current price of 199.000₫.
- A flash-sale SKU in the cart with quantity 3 and `perBuyerLimit` 2; demo control "start the next flash-sale slot" ends the slot to show repricing.

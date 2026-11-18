---
id: US-PDP-005
title: Shipping estimate to my address
epic: PDP
priority: P0
status: Draft
size: S
routes: ["/p/:slug"]
dependsOn: [US-PDP-001, US-FND-008]
---

## Story

As a buyer, I want to see what shipping costs and when it arrives at my address before I add to cart, so that the total at checkout holds no surprise.

## Acceptance criteria

- Given I have a default address, then the shipping row shows "Vận chuyển tới {Phường/Xã}, {Tỉnh/Thành phố}", the cheapest available option's "Phí vận chuyển {fee}" and "Nhận hàng {dd/mm} – {dd/mm}" (rules.md#shipping).
- Given I tap the row, then the shipping sheet lists each available "Phương thức vận chuyển" ("Hỏa tốc", "Nhanh", "Tiết kiệm") with its fee and date range, using the selected SKU's weight or the product's `weightGrams` when none is picked.
- Given the shop and my address are in different provinces, then "Hỏa tốc" is not listed (rules.md#shipping).
- Given I open "Đổi địa chỉ" in the sheet, then I can pick another saved address; the estimate recalculates for this page only and the default address does not change.
- Given the product is `freeShipEligible`, then the row adds the line "Freeship với Voucher miễn phí vận chuyển" (the fee itself is shown unchanged, since the voucher applies at checkout, rules.md#voucher-math).
- Given the shop ships from abroad, then the row adds "Gửi từ nước ngoài" and the date range uses the cross-border lead time from the fee table.

## UI states

- Empty: no saved address → the row reads "Thêm địa chỉ nhận hàng để xem phí vận chuyển" and the fee shown is a range across provinces ("15.000₫ – 45.000₫"); the action links to the address form (US-ACC-003 when built; until then hidden).
- Loading: the row shows a short skeleton line while the quote computes with mock latency.
- Error: quote fails → "Chưa tính được phí vận chuyển" with "Thử lại".
- Unavailable: delisted or sold out → the row still shows (shipping info is useful when it is back), muted.
- Overflow: "Phường Hòa Xuân, Thành phố Đà Nẵng" wraps to two lines; a fee of "125.000₫" and two date ranges fit one line on web, wrap on app.

## Design notes

- Web (≥ 1024): one row in the right column under the picker: truck icon, two lines of text, chevron. The sheet opens as a small popover side panel (US-FND-008) with radio-less rows (it only informs here; the choice happens at checkout).
- App (< 1024): a row in its own section with the same content; the sheet is a bottom sheet.
- Dates in `dd/mm` short form inside ranges, full `dd/mm/yyyy` nowhere on this row (rules.md#spec-conventions).

## FE notes

- Pure, TDD: `quoteShipping({ shopProvince, addressProvince, weightGrams, option, crossBorder, today })` → `{ fee, from, to } | null` reading the fixed fee table in mock data; `availableOptions(shopProvince, addressProvince)`. Owned here, reused by US-CHK-003.
- Address list from the store; the page-local address override is component state, not persisted.

## Mock data

- Persona default address in Đà Nẵng; second address Văn phòng in Đà Nẵng; a Hà Nội address is added during the demo.
- A Đà Nẵng shop (Hỏa tốc available), a TP.HCM shop (no Hỏa tốc), and a cross-border shop.
- Fee table by option × same/other province × weight band (≤ 500 g, ≤ 2 kg, > 2 kg).

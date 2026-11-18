---
id: US-CHK-003
title: Shipping option per shop
epic: CHK
priority: P0
status: Draft
size: S
routes: ["/checkout"]
dependsOn: [US-CHK-001, US-FND-008]
---

## Story

As a buyer, I want to choose the shipping option and carrier for each shop's parcel and see its fee and delivery dates, so that I can pay more for the parcel I need soon and less for the rest.

## Acceptance criteria

- Given a shop block, then its shipping row shows "Phương thức vận chuyển", the option name ("Nhanh"), the fictional carrier name, the fee "22.000₫" (or the fee struck through and the reduced fee when a shipping voucher applies), and "Nhận hàng 21/11 – 23/11"; default option is "Nhanh".
- When I tap the row, then the shipping sheet (app) or popover (web) lists "Hỏa tốc", "Nhanh", "Tiết kiệm", each with carrier, fee, and delivery range, and a radio.
- Given the shop and my address are in different provinces, then "Hỏa tốc" is listed disabled with "Chỉ áp dụng khi Shop và địa chỉ nhận cùng tỉnh" (rules.md#shipping).
- Given I choose another option and press "Xác nhận", then only that shop's fee and delivery range change, and "Chi tiết thanh toán", the shipping voucher amounts, and "Tổng thanh toán" update.
- Given fees, then they come from the mock fee table by option, buyer province vs shop province, and total line weight (rules.md#shipping); the same inputs always give the same fee.
- Given a cross-border shop, then its delivery range is longer and the row adds "Giao từ nước ngoài".

## UI states

- Empty: none (every shop has at least "Nhanh" and "Tiết kiệm").
- Loading: fee and dates show a short shimmer while the address change recomputes.
- Error: none beyond the page error (fees are a local table).
- Unavailable: "Hỏa tốc" across provinces, disabled with its reason, never hidden.
- Overflow: long carrier names truncate; fee `125.000₫` for a heavy parcel fits; date ranges crossing a month ("Nhận hàng 29/11 – 02/12") fit on one line.

## Design notes

- Web (≥ 1024): row inside the shop block, right-aligned fee; popover 360px anchored to the row with radio rows.
- App (< 1024): full-width row with chevron; bottom sheet with radio rows and the black pill "Xác nhận".
- Delivery dates in the secondary ink; a discounted fee shows the struck original and the new fee in the deal colour.

## FE notes

- Component `ShippingOptionRow`, `ShippingOptionSheet`; state `checkout.session.shippingOption[shopId]`.
- Pure functions, TDD: `shippingQuote(shop, address, option, weightGrams)` → `{ fee, etaFrom, etaTo, carrier }` (shared with US-CRT-001), `availableShippingOptions(shop, address)`, `normalizeShippingOption` (US-CHK-002). Dates resolved against the mock clock.

## Mock data

- Fixed fee table in `src/mock/data/shipping.json`: 3 options × same-province / other-province × weight bands; the §4.3 fees (Shop A 22.000₫, Shop B 35.000₫ with "Nhanh" to Đà Nẵng) are rows of this table.
- Two cross-border shops; one Đà Nẵng shop for "Hỏa tốc".

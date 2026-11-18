---
id: US-CRT-005
title: Apply a shop voucher in the cart
epic: CRT
priority: P0
status: Draft
size: M
routes: ["/cart"]
dependsOn: [US-CRT-002, US-FND-008]
---

## Story

As a buyer, I want to see and choose each shop's voucher inside that shop's group, and to know exactly how much more to buy to unlock one, so that I get the shop discount without hunting for it.

## Acceptance criteria

- Given a shop has at least one active shop voucher, then its group shows a row "Voucher của Shop" with the applied voucher's label ("Giảm 30.000₫") or "Chọn voucher" when none applies; shops without vouchers show no row.
- Given I have selected lines in that shop, then the best eligible voucher (largest discount, ties → earliest `endsAt`) is applied automatically on load and whenever selection or quantity changes, unless I removed or picked one myself in this session (rules.md#voucher-math item 1).
- Given the shop's selected goods are below the minimum of its best voucher, then the row shows "Mua thêm 23.000₫ để dùng voucher" in the deal colour, where 23.000₫ is `minSpend` − selected goods for that voucher (rules.md#voucher-math item 1).
- When I tap the row, then the shop-voucher sheet (app) or side panel (web) opens (US-FND-008) listing the shop's vouchers: each with label, condition "Đơn tối thiểu 450.000₫", expiry "HSD: 30/11/2026", and a radio; ineligible ones are disabled with their reason ("Mua thêm 54.000₫ để dùng voucher", "Đã hết lượt sử dụng"); an unsaved voucher shows "Lưu" which saves it (PRM SavedVoucher) and then enables its radio.
- Given I choose a voucher and press "Đồng ý", then at most one shop voucher is applied for that shop, the group shows the discount line "−30.000₫", and the totals bar (US-CRT-002) and "Tiết kiệm" update.
- Given an applied voucher stops holding (deselect, quantity change, voucher expired by demo control), then it is removed and the row shows the inline note "Voucher {label} không còn áp dụng: {reason}" until the next change (rules.md#voucher-math item 6).
- Given I continue to checkout, then the applied shop vouchers carry over to US-CHK-001 unchanged.

## UI states

- Empty: shop with vouchers but no selected lines → row shows "Chọn sản phẩm để dùng voucher" and the sheet opens read-only.
- Loading: the sheet lists vouchers from the store at once; "Lưu" shows an inline spinner for the mock latency.
- Error: "Lưu" fails → "Không lưu được voucher. Thử lại." inline under that voucher.
- Unavailable: expired, quota used up (`usedCount ≥ totalQuota`), per-buyer limit reached, or below minimum; each disabled with its reason, never hidden.
- Overflow: four vouchers per shop scroll in the sheet; a voucher label with percent and cap ("Giảm 15% tối đa 50.000₫") wraps to two lines, the radio stays top-aligned.

## Design notes

- Web (≥ 1024): the voucher row sits between the shop header and the first line, a ticket-shaped hairline outline with a small ticket icon; it opens a 400px right side panel. The "Mua thêm" text is a link-styled line in the deal colour.
- App (< 1024): same row, full width; opens a bottom sheet with a sticky full-width black pill "Đồng ý".
- Discount lines use the deal colour with a leading minus; never red.

## FE notes

- Components `ShopVoucherRow`, `ShopVoucherSheet`; state `cart.shopVoucherChoice[shopId]` = `auto | none | voucherId`.
- Pure functions, TDD in `src/lib/pricing/`: `shopVoucherDiscount(voucher, goods)` (amount: `min(value, base)`; percent: `min(floor(base × pct), maxDiscount)`, rules.md#voucher-math item 4), `voucherEligibility(voucher, base, now, savedVoucher)` → `{ ok } | { ok: false, reason, shortBy? }`, `bestShopVoucher(vouchers, goods, now)`, and `voucherLabel(voucher)` that builds the display name from kind, value, and maxDiscount (Voucher has no name field).
- The same functions are used by `priceCheckout` in US-CHK-001; nothing about shop vouchers is computed twice.

## Mock data

- Seeded cart shop with a voucher just below its minimum: "Mua thêm 23.000₫ để dùng voucher" on load.
- The §4.3 shops: Shop A (goods 478.000₫, voucher −30.000₫ from 450.000₫, applies) and Shop B (goods 245.000₫, voucher from 299.000₫, "Mua thêm 54.000₫ để dùng voucher").
- One shop voucher not yet saved, one with quota used up, one expiring in 2 hours; demo control "expire a voucher" removes an applied one.

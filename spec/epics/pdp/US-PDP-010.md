---
id: US-PDP-010
title: Shop vouchers on the product page
epic: PDP
priority: P0
status: Draft
size: S
routes: ["/p/:slug"]
dependsOn: [US-PDP-001, US-FND-008, US-PRM-002]
---

## Story

As a buyer, I want to see and save this shop's vouchers on the product page, so that I know the deal I can get before adding to cart.

## Acceptance criteria

- Given the shop has live shop vouchers with quota left, then a row "Voucher của Shop" shows up to 3 compact tickets ("Giảm 20K", "Giảm 10%") and "Xem tất cả ›" when there are more.
- Given I open the row, then the voucher sheet lists every live shop voucher with: the discount ("Giảm 15% Giảm tối đa 50K"), "Đơn tối thiểu {amount}", the expiry ("HSD: 30/11/2026", or "Hết hạn sau {n} giờ" under 24 h), "Điều kiện" (opens US-PRM-003 when built), and a "Lưu" button.
- Given I press "Lưu", then the voucher is saved through the voucher hub (US-PRM-002), the button changes to "Đã lưu" (disabled), and the toast "Đã lưu voucher" shows.
- Given I have already saved a voucher, then it shows "Đã lưu" when the sheet opens.
- Given a voucher's quota is used up while the sheet is open, when I press "Lưu", then it shows "Đã hết lượt" and is disabled.
- Given the shop has no live voucher, then the row is not rendered.

## UI states

- Empty: no live voucher → row hidden.
- Loading: "Lưu" shows a spinner during the mock latency.
- Error: save fails → toast "Không lưu được voucher. Thử lại."
- Unavailable: expired vouchers never show; used-up quota → "Đã hết lượt"; a voucher I have used up to `perBuyerLimit` → "Đã dùng".
- Overflow: 4 shop vouchers (mock maximum) → 3 tickets plus "Xem tất cả ›"; an amount "Giảm 1,2Tr" uses the compact form in tickets and the full form "Giảm 1.200.000₫" in the sheet.

## Design notes

- Web (≥ 1024): a row in the right column under the price block: label "Voucher của Shop" muted, tickets as small pills with a dashed edge in the deal-colour tint; the sheet is a side panel (US-FND-008).
- App (< 1024): a row under the price block with tickets and a chevron; the sheet is a bottom sheet with voucher cards, "Lưu" as a small black pill.
- Tickets never use red; the dashed edge is the only "coupon" cue.

## FE notes

- Selector `liveShopVouchers(vouchers, shopId, now)` and the save action come from the voucher hub store (US-PRM-002); `voucherLabel(voucher)` for compact and full forms is pure and TDD (amount vs percent, maxDiscount, compact money from US-FND-002).
- `ShopVoucherTicket` and `VoucherSheet` are shared with US-SHP-003; whichever story lands first builds them.
- The PDP does not apply vouchers; application is CRT and CHK.

## Mock data

- A shop with 4 live vouchers (amount, percent with cap, one expiring in 2 hours, one with quota 1 already used up after one claim), a shop with only an expired voucher (row hidden).

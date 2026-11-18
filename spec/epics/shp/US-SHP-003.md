---
id: US-SHP-003
title: Shop vouchers row
epic: SHP
priority: P0
status: Draft
size: S
routes: ["/s/:handle"]
dependsOn: [US-SHP-001, US-PRM-002]
---

## Story

As a buyer on a shop page, I want to see and save the shop's vouchers at the top, so that I plan my basket around the deal.

## Acceptance criteria

- Given the `shop` tab and the shop has live vouchers with quota left, then a "Voucher của Shop" row shows every one of them (2 to 4 in mock data) as voucher cards: discount ("Giảm 15%" with "Giảm tối đa 50K", or "Giảm 20K"), "Đơn tối thiểu {amount}", expiry ("HSD: 30/11/2026", or "Hết hạn sau {n} giờ" under 24 h), and a "Lưu" button.
- Given I press "Lưu", then the voucher is saved through the voucher hub (US-PRM-002), the button becomes "Đã lưu" (disabled), and the toast "Đã lưu voucher" shows.
- Given I already saved a voucher, then the card shows "Đã lưu" on load.
- Given a voucher's quota is used up, then the card shows "Đã hết lượt" and is disabled; given I used it up to `perBuyerLimit`, it shows "Đã dùng".
- Given the shop has no live voucher, then the row is not rendered (no empty frame).
- Given I tap a card body, then the voucher conditions open (US-PRM-003 when built, the same sheet as the voucher hub).

## UI states

- Empty: no live voucher → row hidden.
- Loading: 3 card skeletons with the header.
- Error: save fails → toast "Không lưu được voucher. Thử lại."
- Unavailable: expired → never shown; used-up quota → "Đã hết lượt"; used by me → "Đã dùng".
- Overflow: 4 vouchers fit one row on web (4 × 280px at 1440, scroll at 1024); on app they scroll horizontally with peek; an amount of "Giảm 1.200.000₫" uses the compact "Giảm 1,2Tr" on the card face.

## Design notes

- Web (≥ 1024): row under the header tabs on the `shop` tab; cards 280 × 88px on the paper tint with a dashed divider between the discount and the action, discount text in the deal colour, "Lưu" as a small black pill.
- App (< 1024): horizontally scrolling cards 240px wide, same anatomy.
- Never red; the dashed divider is the only coupon cue (same as US-PDP-010).

## FE notes

- Reuses `ShopVoucherTicket`, `liveShopVouchers`, and `voucherLabel` (built by US-PDP-010 or here, whichever lands first); save via the voucher hub store (US-PRM-002).
- Pure, TDD: `voucherButtonState(voucher, saved, usedCount, now)` → `save | saved | sold_out | used` (shared with US-PDP-010).

## Mock data

- A shop with 4 live vouchers (one expiring in 2 hours, one with quota used up), a shop with 2, and a shop whose only voucher is expired (row hidden).

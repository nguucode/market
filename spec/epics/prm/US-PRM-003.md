---
id: US-PRM-003
title: Voucher conditions sheet
epic: PRM
priority: P0
status: Draft
size: S
routes: ["/vouchers"]
dependsOn: [US-PRM-002, US-FND-008]
---

## Story

As a buyer, I want to read every condition of a voucher in one place before I count on it, so that I am never surprised at checkout by a minimum, a cap, a payment method or an expiry I did not see.

## Acceptance criteria

- Given I press "Điều kiện" on any voucher tile, then a sheet (app) or side panel (web) titled "Điều kiện sử dụng" opens (US-FND-008) with the tile repeated at the top and these rows in order: "Ưu đãi", "Đơn tối thiểu", "Hạn sử dụng", "Áp dụng cho", "Phương thức thanh toán", "Lượt dùng".
- Given "Ưu đãi", then a percent voucher reads "Giảm 15%, tối đa 50.000₫" and an amount voucher "Giảm 30.000₫"; a shipping voucher reads "Giảm phí vận chuyển tối đa 25.000₫ mỗi shop" (rules.md#voucher-math).
- Given "Đơn tối thiểu", then it states the amount and its base in words from rules.md#voucher-math: shop voucher "300.000₫ tiền hàng của Shop (sản phẩm được chọn)", platform voucher "300.000₫ tiền hàng sau Voucher của Shop, không gồm phí vận chuyển", or "Không có" when `minSpend` is 0.
- Given "Hạn sử dụng", then it reads "00:00 18/11/2026 – 23:59 30/11/2026"; given the voucher has not started, it adds "Bắt đầu sau 3 giờ"; under 24 hours left it adds "Hết hạn sau 2 giờ".
- Given "Áp dụng cho", then it reads "Tất cả sản phẩm trên Market" (platform), "Sản phẩm của Shop {name}" with a link to `/s/:handle` (shop), or "Phí vận chuyển của mọi shop trong đơn" (shipping); given "Phương thức thanh toán", then "Tất cả phương thức" or "Chỉ áp dụng khi thanh toán bằng {method label}" using object-model.md labels.
- Given "Lượt dùng", then it reads "Mỗi tài khoản dùng {n} lần" and, when saved and partly used, "Bạn còn {k} lượt"; when quota is above 80% claimed, it adds "Đã lưu {pct}%".
- Given the sheet's footer, then it shows the same single action as the tile ("Lưu", "Dùng ngay", or disabled "Đã hết lượt") with the claim behaviour of US-PRM-002.
- Given the URL `/vouchers?voucher={id}`, then the hub opens with this sheet for that voucher; an unknown or expired id opens the hub with the inline note "Voucher không còn hiệu lực." and no sheet.

## UI states

- Empty: not applicable; every row has a value or "Không có".
- Loading: the sheet opens with the tile already rendered (data is in hand from the caller); only the deep link shows a skeleton.
- Error: deep-link lookup failure → hub with "Không tải được voucher." and "Thử lại".
- Unavailable: an expired voucher opened from a stale screen shows "Voucher đã hết hạn." at the top and a disabled footer; an exhausted one shows "Đã hết lượt".
- Overflow: a 40-character shop name in "Áp dụng cho" wraps to two lines; the long platform-voucher base sentence wraps within 360px; rows never truncate (conditions must be read in full).

## Design notes

- App (< 1024): bottom sheet up to 90% height, rows as label (13px, 70% ink) above value (15px ink), 16px vertical rhythm, hairlines between rows, sticky footer pill.
- Web (≥ 1024): 420px side panel, rows as a two-column definition list (label 160px, value fills), footer pill full panel width.
- Plain language, no fine print styling: the conditions are the point of the sheet, so they use body size, not caption size.

## FE notes

- `VoucherConditionsSheet.tsx` reuses `VoucherTile` and `useClaimVoucher` from US-PRM-002.
- `describeVoucher(voucher, saved, shopsById, now)` pure and TDD: returns the six rows' strings for platform, shop and shipping vouchers, percent and amount kinds, with and without `paymentMethods`, `maxDiscount`, `minSpend` 0, not-yet-started and under-24-hours cases. Money via `formatVnd` (US-FND-002); the base wording mirrors rules.md#voucher-math and a test pins it.
- Deep link `?voucher=` on `/vouchers`, removed from the URL (replace) when the sheet closes.

## Mock data

- The payment-restricted platform voucher (Ví Sen only; method "Ví điện tử", fictional wallet name per CHK), the 2-hour-expiry voucher, the §4.3 vouchers (15% capped at 50.000₫; shipping capped at 25.000₫ per shop), a shop voucher with `minSpend` 0, and one with a future `startsAt`.

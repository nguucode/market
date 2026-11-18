---
id: US-CHK-005
title: Platform and shipping vouchers at checkout
epic: CHK
priority: P0
status: Draft
size: M
routes: ["/checkout"]
dependsOn: [US-CHK-001, US-CRT-005]
---

## Story

As a buyer, I want to pick one Market voucher and one shipping voucher for the whole checkout and see exactly what each saves, so that I use the best deals I saved and understand how they are split across my shops.

## Acceptance criteria

- Given checkout loads, then the row "Voucher Market" shows the applied platform and shipping vouchers by label ("Giảm 15% tối đa 50.000₫", "Giảm tối đa 25.000₫ phí vận chuyển mỗi shop") or "Chọn voucher" when none; the best eligible saved voucher of each scope is pre-applied (largest discount, ties → earliest `endsAt`).
- When I tap the row, then the voucher sheet (app) or side panel (web) shows two sections, "Voucher miễn phí vận chuyển" and "Voucher Market", one radio choice per section with "Bỏ chọn"; each voucher shows label, "Đơn tối thiểu {x}₫", "HSD: 30/11/2026", and ineligible ones are disabled with their reason ("Mua thêm {x}₫ để dùng voucher", "Chỉ áp dụng khi thanh toán bằng {method}", "Đã hết hạn").
- Given a platform voucher, then its base and `minSpend` check are Σ shop `net` (goods − shop voucher), shipping excluded, and the discount follows rules.md#voucher-math items 2 and 4.
- Given a shipping voucher, then each shop's fee is reduced by up to `maxPerShop` and never below 0 (rules.md#voucher-math item 3); its `minSpend` is checked against the same Σ shop `net`.
- Given the platform discount, then each shop block shows its share as "Voucher Market −32.323₫", allocated pro rata to `net` by largest remainder so the shares sum exactly to the voucher amount (rules.md#voucher-math item 5).
- Given an applied voucher stops holding (a shop voucher change lowers the base, the payment method changes, the voucher expires via demo control), then it is removed with the inline note "Voucher {label} không còn áp dụng: {reason}" (rules.md#voucher-math item 6).
- Given the §4.3 fixture, then the platform voucher reads −50.000₫ (capped from 103.950₫) split 32.323₫ / 17.677₫, and the shipping voucher −47.000₫ split 22.000₫ / 25.000₫.

## UI states

- Empty: no saved vouchers → the sheet shows "Bạn chưa lưu voucher nào" and a link "Đến Kho voucher" (`/vouchers`), plus any claimable platform vouchers with "Lưu".
- Loading: "Lưu" spinner inline; the list itself is local.
- Error: "Lưu" fails → "Không lưu được voucher. Thử lại." under that voucher.
- Unavailable: below minimum, wrong payment method, expired, quota used up; each disabled with its reason, sorted after the eligible ones, never hidden.
- Overflow: 6 platform and 3 shipping vouchers scroll inside the sheet with sticky section headers; the "expires in 2 hours" voucher shows "Sắp hết hạn: còn 1 giờ 45 phút".

## Design notes

- Web (≥ 1024): the row sits below the last shop block with a ticket icon; side panel 440px, sticky black pill "Đồng ý" at the bottom.
- App (< 1024): full-width row with chevron; bottom sheet at 85% height; black pill "Đồng ý".
- Voucher tiles are ticket-shaped hairline outlines on paper; the amount in the deal colour; disabled tiles at 50%.

## FE notes

- Components `PlatformVoucherRow`, `CheckoutVoucherSheet`; state `checkout.session.platformVoucherId`, `shippingVoucherId`, plus `userCleared` flags so auto-apply does not fight the buyer.
- Pure functions, TDD: `platformVoucherDiscount(voucher, base, paymentMethod, now)`, `shippingVoucherDiscount(voucher, fees[])` → per-shop discounts, `allocateLargestRemainder(total, weights)`, `bestVoucher(vouchers, ctx)`, `revalidateVouchers` (shared with US-CHK-004). All consumed by `priceCheckout` (US-CHK-001).
- Largest-remainder tests: ties broken by shop order in the session; zero weights get zero; a 1-shop session gets the whole amount.
- Enhanced by CHK P1: Enter a voucher code ("Nhập mã voucher").

## Mock data

- 6 platform and 3 shipping vouchers (ia/mock-data.md), including the 15% capped at 50.000₫, the shipping voucher capped at 25.000₫ per shop, the one restricted to one payment method, and the one expiring in 2 hours.
- Demo control "expire a voucher" to show removal with its note.

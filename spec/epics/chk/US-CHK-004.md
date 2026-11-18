---
id: US-CHK-004
title: Payment method
epic: CHK
priority: P0
status: Draft
size: M
routes: ["/checkout"]
dependsOn: [US-CHK-001, US-FND-008]
---

## Story

As a buyer, I want to choose how I pay, with cash on delivery as the default and a clear reason when it is not allowed, so that I am never surprised by a method that silently disappears or a voucher that silently stops.

## Acceptance criteria

- Given checkout loads, then the row "Phương thức thanh toán" shows "Thanh toán khi nhận hàng" by default; the sheet lists, in this order, "Thanh toán khi nhận hàng", "Chuyển khoản ngân hàng (VietQR)", "Ví điện tử" (with the fictional wallets as sub-options), "Thẻ tín dụng/ghi nợ" (rules.md#payment).
- Given a shop in the session has `codEnabled: false`, then "Thanh toán khi nhận hàng" is disabled for the whole session with the reason "{Tên shop} không hỗ trợ Thanh toán khi nhận hàng", and that shop's block repeats "Shop không hỗ trợ Thanh toán khi nhận hàng"; the default becomes "Chuyển khoản ngân hàng (VietQR)".
- Given any shop order in the session would exceed the COD cap in rules.md#payment, then COD is disabled with "Thanh toán khi nhận hàng chỉ áp dụng cho đơn dưới 10.000.000₫".
- Given the applied "Voucher Market" is restricted to a payment method, when I pick a different method, then the voucher is removed and the voucher row shows "Voucher {label} chỉ áp dụng khi thanh toán bằng {method}. Đã gỡ voucher." (rules.md#voucher-math items 2 and 6); the totals update at once.
- Given the payment sheet, then a method that would unlock a restricted saved voucher shows the hint "Dùng được {label}" under its name.
- Given I pick an online method, then the place-order area adds the note "Bạn có 15 phút để hoàn tất thanh toán sau khi đặt hàng" (rules.md#payment).

## UI states

- Empty: none (at least one online method is always available).
- Loading: none (methods are local).
- Error: none beyond the page error.
- Unavailable: COD disabled by shop setting or cap, each with its reason; when I deselect the COD-off shop in the cart and come back, COD is available again.
- Overflow: reason text naming the 40-character shop wraps to two lines under the disabled option; the selected method label in the row truncates on app.

## Design notes

- Web (≥ 1024): the method row in the left column opens a 400px side panel with radio rows; disabled rows at 50% with the reason in the secondary ink, never red.
- App (< 1024): full-width row with chevron; bottom sheet with radio rows and black pill "Xác nhận"; "Ví điện tử" expands inline to its two fictional wallets.
- No real bank, wallet, or card network logos; neutral glyphs only.

## FE notes

- Component `PaymentMethodRow`, `PaymentMethodSheet`; state `checkout.session.paymentMethod` = `cod | vietqr | wallet:{id} | card`.
- Pure functions, TDD: `availablePaymentMethods(shops, orderTotals)` → list with `{ method, disabledReason? }`; `defaultPaymentMethod(available)`; `revalidateVouchers(session, priced)` (shared with US-CHK-005) returns removed vouchers with their notes.
- Enhanced by CHK P1: Installment ("Trả góp").

## Mock data

- Three shops with COD off (ia/mock-data.md); the seeded three-shop cart contains one.
- The platform voucher that only works with one payment method (ia/mock-data.md), saved by the persona.
- One product at `12.499.000₫` to push a single order over the COD cap.
- Fictional wallets "Ví Sen" and "Ví Mây".

---
id: US-CHK-007
title: Online payment page with expiry
epic: CHK
priority: P0
status: Draft
size: M
routes: ["/checkout/pay/:paymentId"]
dependsOn: [US-CHK-006, US-FND-004]
---

## Story

As a buyer who chose an online method, I want a payment page that shows the amount, how to pay, and how long I have, so that I can finish paying or understand clearly what happens if I do not.

## Acceptance criteria

- Given an online Payment in `pending`, when `/checkout/pay/:paymentId` loads, then I see "Thanh toán đơn hàng", the amount "653.000₫", "{n} đơn hàng" with shop names, and the countdown "Thanh toán trong 14:59" (mm:ss) computed from `expiresAt`, which survives reload.
- Given the method is VietQR, then the page shows a mock QR, the fictional bank, account name and number, the amount, and the transfer content `MK` + payment id, each with "Sao chép", plus the button "Tôi đã chuyển khoản".
- Given the method is a wallet, then the page shows a confirm step "Xác nhận thanh toán bằng {Ví Sen}" with the amount and the button "Xác nhận"; given card, then a form (Số thẻ, Tên chủ thẻ, Ngày hết hạn, CVV) that accepts only the test numbers shown in the note "Bản demo chỉ nhận thẻ thử. Không nhập thẻ thật." and rejects others with "Số thẻ không hợp lệ".
- Given I submit, then the outcome follows the demo control "next online payment" (US-FND-004): success → Payment `paid`, orders to "Chờ xác nhận", and I go to `/checkout/result/:paymentId`; failure → "Thanh toán không thành công" with "Thử lại" while time remains; timeout → as expiry below. Default with no control set is success.
- Given the countdown reaches 0 (or the demo control "Hết hạn thanh toán" fires), then the Payment becomes `expired`, every order is cancelled by the system with reason "Hết hạn thanh toán" (rules.md#payment, rules.md#order-rules), and the page shows "Đã hết hạn thanh toán" with "Xem đơn mua" (`/orders?status=cancelled`) and "Tiếp tục mua sắm".
- Given I press "Thanh toán sau", then I go to `/orders?status=awaiting_payment` and the orders stay in "Chờ thanh toán" until expiry (resumed by US-ORD-005).
- Given the Payment is already `paid`, then the route redirects to the result; given the id is unknown, then the not-found page shows (US-FND-006).

## UI states

- Empty: unknown payment id → US-FND-006.
- Loading: amount and QR skeleton; submit shows "Đang xử lý…" for the mock latency.
- Error: failure outcome copy above; "Sao chép" failing silently falls back to selecting the text.
- Unavailable: expired payment (above); a cancelled order inside it cannot be paid.
- Overflow: 13-character amounts; 8 orders in one Payment list as "8 đơn hàng" with a "Xem chi tiết" disclosure; under 1 minute the countdown shows "00:45" in ink bold (no red, no flashing).

## Design notes

- Web (≥ 1024): focused shell; centred 560px column: amount in 32px bold, countdown under it, method panel (QR 240px or form), secondary actions as text links. The QR is generated locally, never fetched.
- App (< 1024): back + "Thanh toán đơn hàng" header; same stack full width; primary action as sticky black pill at the bottom.
- The countdown is text, not a ring or bar, matching the calm deal tone of the reference study; `aria-live="polite"` announces each full minute only.

## FE notes

- Route `/checkout/pay/:paymentId`, page `PaymentPage` with `VietQrPanel`, `WalletConfirm`, `CardForm`.
- Store actions `payments.submit(id, input)`, `payments.expire(id)`; the store, not the page, cancels orders at expiry so it also happens when the page is closed.
- Pure functions, TDD: `remainingSeconds(expiresAt, now)` (never negative), `isTestCard(number)` (Luhn plus allow-list), `transferContent(paymentId)`. Countdown ticks from `Date.now()` each second, not by decrementing.

## Mock data

- Payment with `expiresAt` = created + 15 minutes; test card numbers listed in `src/mock/data/test-cards.json` and printed in the form note.
- Fictional bank "Ngân hàng Sông Hàn" and wallets "Ví Sen", "Ví Mây".
- Demo controls: next payment success / failure / timeout, "Hết hạn thanh toán".

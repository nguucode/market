---
id: US-ORD-005
title: Pay for an unpaid order
epic: ORD
priority: P0
status: Draft
size: S
routes: ["/orders", "/orders/:id"]
dependsOn: [US-ORD-002, US-CHK-007]
---

## Story

As a buyer who left the payment page before paying, I want to finish paying from my orders before the time runs out, so that I do not lose the order or have to check out again.

## Acceptance criteria

- Given an order in `awaiting_payment`, then its card and detail show "Thanh toán ngay" as the primary action and the line "Thanh toán trước 14:20 · còn 12:34" counting down to `Payment.expiresAt` (rules.md#payment), plus "Hủy đơn hàng" as the secondary action (US-ORD-003).
- Given the Payment covers several orders, then the detail says "Thanh toán chung cho {n} đơn hàng · Tổng 653.000₫" and every one of those orders shows the same countdown.
- Given I tap "Thanh toán ngay", then I go to `/checkout/pay/:paymentId` (US-CHK-007) with the method chosen at checkout; the amount is the whole Payment, not this order alone.
- Given the payment succeeds (Demo control), then every order under the Payment becomes "Chờ xác nhận" with `paymentStatus: paid` and the TrackingEvent "Đã thanh toán", and the result page returns me to `/orders/:id`.
- Given the countdown reaches zero or the Demo control "Hết hạn thanh toán" fires, then every order under the Payment becomes "Đã hủy" with "Hệ thống đã hủy · Lý do: Quá hạn thanh toán" and the action changes to "Mua lại"; a payment page left open shows its expired state (US-CHK-007).
- Given the payment fails, then the orders stay "Chờ thanh toán" and "Thanh toán ngay" remains available until expiry.

## UI states

- Empty: none.
- Loading: the button shows a spinner while the Payment is read; the countdown renders from `expiresAt` without waiting.
- Error: Payment not found → "Không mở được trang thanh toán." toast; the order stays.
- Unavailable: expired → as above; COD orders never reach this state.
- Overflow: "Thanh toán chung cho 3 đơn hàng · Tổng 12.499.000₫" wraps after "·" at 375 px; the countdown never shifts width (tabular digits).

## Design notes

- Web (≥ 1024): countdown line under the status label in the status block, deal colour for the time left, black pill "Thanh toán ngay" in the right column.
- App (< 1024): countdown in the status band; "Thanh toán ngay" in the sticky bottom bar with "Hủy đơn hàng" as the outlined pill.
- Under 60 seconds the countdown text adds "Sắp hết hạn"; no flashing.

## FE notes

- Pure functions to TDD: `timeLeft(expiresAt, now)` → `{ mm, ss, expired }`, `ordersSharingPayment(order, orders)` (shared with US-ORD-003), `expirePayment(payment, orders, now)` → cancelled orders with `cancelledBy: system`.
- One ticking clock hook for the app (US-FND-004 jumps it); the store runs expiry on tick so the list, detail, and pay page agree.
- Enhanced by ORD P1: Change the payment method of an unpaid order.

## Mock data

- The 2 orders sharing one VietQR Payment with 12 minutes left; one card Payment with 40 seconds left for the "Sắp hết hạn" state.
- Demo control scenarios: next payment success, failure, timeout; "Hết hạn thanh toán".

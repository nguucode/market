---
id: US-CHK-008
title: Order placed result
epic: CHK
priority: P0
status: Draft
size: S
routes: ["/checkout/result/:paymentId"]
dependsOn: [US-CHK-006]
---

## Story

As a buyer, I want a result page that shows each order created from my checkout, so that I understand that my cart became one order per shop and where to follow each.

## Acceptance criteria

- Given a COD session was placed, when `/checkout/result/:paymentId` loads, then the title is "Đặt hàng thành công" and the summary reads "Bạn sẽ thanh toán 653.000₫ khi nhận hàng"; given a paid online session, then it reads "Đã thanh toán 653.000₫ bằng {phương thức}".
- Given the session created n orders, then the page states "Đơn của bạn được tách thành {n} đơn hàng theo từng Shop" and lists each order: shop name, order id `MK…`, item count, "Nhận hàng 21/11 – 23/11", the order total, and the status "Chờ xác nhận"; each row links to `/orders/:id`.
- Given the list, then Σ order totals equals the summary amount, to the đồng.
- Given the page, then it offers "Xem đơn mua" (`/orders`) as the black pill and "Tiếp tục mua sắm" (`/`) as an outline pill.
- Given the Payment is online and still `pending`, then the route redirects to `/checkout/pay/:paymentId`; given it is `expired`, then it redirects to the pay page, which shows the expired state.
- Given I press Back from this page, then I do not return to `/checkout` (the session is cleared, US-CHK-006) but to `/cart`.

## UI states

- Empty: unknown payment id → US-FND-006.
- Loading: title skeleton and n order-row skeletons.
- Error: "Không tải được thông tin đơn hàng." with "Thử lại"; the orders exist regardless.
- Unavailable: none (pending and expired redirect).
- Overflow: 8 orders list fully (no truncation, rules.md#order-rules); the 40-character shop name truncates; a 13-character total fits.

## Design notes

- Web (≥ 1024): focused shell; centred 640px column; serif heading "Đặt hàng thành công", a calm check glyph in ink (no confetti), the summary line, then order rows as plain rows separated by hairlines, then the two pills side by side.
- App (< 1024): header with close (×) to Home instead of back; same stack; pills stacked full width at the bottom.

## FE notes

- Route `/checkout/result/:paymentId`, page `OrderResultPage`; selector `selectOrdersByPayment(paymentId)`.
- Uses the order snapshot only; no repricing. Replaces history so Back skips `/checkout/pay` and `/checkout`.
- Pure function, TDD: `resultRedirect(payment)` → `null | pay route`.

## Mock data

- Result for the §4.3 session (2 orders, 415.677₫ and 237.323₫, COD) and for the three-shop session paid by VietQR.

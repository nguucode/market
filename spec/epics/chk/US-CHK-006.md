---
id: US-CHK-006
title: Place order with last-moment checks
epic: CHK
priority: P0
status: Draft
size: M
routes: ["/checkout"]
dependsOn: [US-CHK-002, US-CHK-003, US-CHK-004, US-CHK-005, US-FND-010]
---

## Story

As a buyer, I want "Đặt hàng" to recheck stock, prices, and vouchers and tell me exactly what changed before anything is created, so that the orders I get match what I agreed to.

## Acceptance criteria

- When I press "Đặt hàng", then the button shows "Đang đặt hàng…" and is disabled, and the store runs, in one step, the checks: address present, every line still active and in stock for its quantity, every unit price equal to what the page shows, every applied voucher still valid (not expired, quota left, conditions met), and COD still allowed when chosen.
- Given any check fails, then no order is created and a dialog "Đơn hàng có thay đổi" lists each change as a row: "{tên sản phẩm}: 189.000₫ → 199.000₫", "{tên sản phẩm}: chỉ còn 1 sản phẩm, đã cập nhật số lượng", "{tên sản phẩm}: đã hết hàng, đã bỏ khỏi đơn", "Voucher {label}: đã hết hạn, đã gỡ", then "Tổng thanh toán 653.000₫ → 671.000₫"; its only action "Xem lại đơn hàng" closes it with the page already updated, and I must press "Đặt hàng" again.
- Given all checks pass, then one Payment and one Order per shop are created, each order with id `MK` + 12 digits and a snapshot of lines, prices, shop discount, platform share, shipping fee and discount, address, shipping option, payment method, and "Lời nhắn cho Shop" (rules.md#checkout-disclosures, last item); Σ order totals equals the Payment amount.
- Given the method is "Thanh toán khi nhận hàng", then orders start in "Chờ xác nhận" and I go to `/checkout/result/:paymentId`; given an online method, then orders start in "Chờ thanh toán", the Payment gets `expiresAt` = now + 15 minutes (rules.md#payment), and I go to `/checkout/pay/:paymentId`.
- Given orders were created, then the ordered lines leave the cart, each applied voucher's usage count increases, and the checkout session is cleared, so Back or refresh on `/checkout` lands on `/cart`.
- Given I double-click or the network retries, then at most one set of orders is created per checkout session.
- Given the store write fails, then nothing is created, the button returns to "Đặt hàng", and the toast reads "Không đặt được hàng. Vui lòng thử lại.".

## UI states

- Empty: every line removed by the checks → the dialog ends with "Không còn sản phẩm nào để đặt" and "Về giỏ hàng" instead of "Xem lại đơn hàng".
- Loading: button spinner "Đang đặt hàng…" for the mock latency; the page is inert.
- Error: write failure toast (above).
- Unavailable: delisted, out of stock, price changed, voucher expired or no longer met, COD no longer allowed; each a row in the diff dialog.
- Overflow: up to 10 change rows scroll inside the dialog; long product names clamp to one line with the price change kept visible.

## Design notes

- Web (≥ 1024): the dialog is the centred confirmation dialog from US-FND-010, 520px, rows with the old value struck through and the new value in ink; the total change in 18px bold.
- App (< 1024): the same content as a bottom sheet; "Xem lại đơn hàng" full-width black pill.
- Changes are facts, so neutral ink, not red; only removed lines get a small "Đã bỏ" tag.

## FE notes

- Store action `checkout.placeOrder(sessionId)` with an idempotency key = session id.
- Pure functions, TDD: `diffCheckout(shownPriced, freshPriced)` → list of typed changes (`price`, `qty_clamped`, `removed`, `voucher_removed`, `cod_disabled`, `total`); `buildOrders(priced, session, now, idGen)` → `{ payment, orders[] }`. Tests reuse the §4.3 fixture from US-CHK-001 and assert two orders of 415.677₫ and 237.323₫ summing to the Payment of 653.000₫, and that `diffCheckout` is empty when nothing changed.
- Snapshot is copied, never referenced; ORD reads only the snapshot.

## Mock data

- Demo controls (US-FND-004) need two one-shot scenarios for this story, not yet listed in ia/mock-data.md: "Giá thay đổi khi đặt hàng" (next place order sees +10.000₫ on one line) and "Hết hàng khi đặt hàng" (next place order sees one SKU at stock 1). "Expire a voucher" covers the voucher case.
- The §4.3 cart for the happy path; the seeded three-shop cart for a three-order session.

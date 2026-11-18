---
id: US-ORD-004
title: Confirm received
epic: ORD
priority: P0
status: Draft
size: S
routes: ["/orders", "/orders/:id"]
dependsOn: [US-ORD-002, US-FND-010]
---

## Story

As a buyer, I want to confirm I received a delivered order, and to know that confirming does not take away my return window, so that I can close the order without fear.

## Acceptance criteria

- Given an order in `delivered`, then "Đã nhận được hàng" is the primary action on its card (US-ORD-001) and on the detail action bar (US-ORD-002), and the detail status block reads "Đơn hàng sẽ tự động hoàn thành vào 03/12/2026." (`deliveredAt` + the days in rules.md#order-rules).
- Given I tap "Đã nhận được hàng", then the dialog "Xác nhận đã nhận được hàng?" opens with "Hãy kiểm tra sản phẩm trước khi xác nhận. Bạn vẫn có thể yêu cầu trả hàng/hoàn tiền đến 03/12/2026." and buttons "Đã nhận được hàng" (primary) and "Để sau".
- Given I confirm, then the order becomes `completed` ("Hoàn thành") with `completedAt` now, a TrackingEvent "Người mua đã xác nhận nhận hàng", the toast "Đơn hàng đã hoàn thành", and the action bar now shows "Đánh giá" (US-REV-002) and, while the return window is open, "Trả hàng/Hoàn tiền" (rules.md#returns).
- Given I tap "Để sau" or dismiss the dialog, then nothing changes.
- Given the Demo control jumps the clock past the auto-complete date, then the order becomes `completed` with the TrackingEvent "Đơn hàng đã tự động hoàn thành" and no buyer action.
- Given a COD order, then `paymentStatus` already became paid at "Giao thành công" (cash collected), so confirming changes only the order status.

## UI states

- Empty: none.
- Loading: the dialog's confirm button shows a spinner; the dialog stays until the store answers.
- Error: "Không xác nhận được. Vui lòng thử lại." inline in the dialog.
- Unavailable: any status other than `delivered` → no action; a stale dialog after a status change closes with the toast "Trạng thái đơn hàng đã thay đổi."
- Overflow: the dialog body wraps to 3 lines at 375 px; buttons stack vertically below 360 px.

## Design notes

- Web (≥ 1024): centred dialog (US-FND-010), max-width 420, primary black pill right, "Để sau" text button left.
- App (< 1024): the same dialog as a bottom-anchored card with buttons stacked full width, primary on top.
- Calm tone: this is a positive moment, no warning icon; the return date in bold so the reassurance is the first thing read.

## FE notes

- Overlay `confirm-received-dialog` on `/orders/:id` (sitemap.yaml); the card action on `/orders` opens the same dialog over the list.
- Pure functions to TDD: `autoCompleteAt(order)` and `returnDeadline(order)` (both from `deliveredAt`, rules.md#order-rules and #returns), `confirmReceived(order, now)` → completed order with TrackingEvent; throws unless `delivered`.
- The clock jump is a Demo control (US-FND-004); the store runs `autoComplete(orders, now)` after every clock change.

## Mock data

- Two `delivered` orders: one delivered today (dates far off), one delivered 14 days ago (auto-completes on the next clock jump; return window closes the day after).
- A delivered COD order.

---
id: US-ORD-003
title: Cancel an order
epic: ORD
priority: P0
status: Draft
size: M
routes: ["/orders/:id"]
dependsOn: [US-ORD-002, US-FND-008, US-FND-010]
---

## Story

As a buyer, I want to cancel an order that has not left the shop, and to know before I confirm whether it cancels at once or needs the shop's answer and where my money goes, so that I can change my mind without surprises.

## Acceptance criteria

- Given an order in `awaiting_payment` or `to_confirm`, when I tap "Hủy đơn hàng", then the cancel sheet opens with the title "Lý do hủy", a required single-choice list ("Tôi muốn cập nhật địa chỉ/số điện thoại nhận hàng", "Tôi muốn thay đổi sản phẩm (phân loại, số lượng…)", "Thủ tục thanh toán quá rắc rối", "Tôi tìm thấy chỗ mua khác tốt hơn", "Tôi không có nhu cầu mua nữa", "Lý do khác"), and the button "Hủy đơn hàng" disabled until a reason is picked; confirming cancels at once (rules.md#order-rules): status "Đã hủy", `cancelledBy: buyer`, toast "Đã hủy đơn hàng".
- Given "Lý do khác" is picked, then a text field "Nhập lý do" (max 200 characters, counter shown) appears and is required.
- Given an order in `awaiting_payment` that shares its Payment with other orders, then the sheet says "Các đơn hàng cùng lần thanh toán ({n} đơn) cũng sẽ bị hủy." and confirming cancels all of them, because one Payment covers the whole checkout (object-model.md).
- Given an order in `to_ship` with no `cancelRequest`, when I tap "Gửi yêu cầu hủy", then the same sheet opens with the note "Đơn hàng đã được Shop chuẩn bị. Shop sẽ xem xét yêu cầu của bạn. Bạn chỉ có thể gửi yêu cầu hủy một lần cho đơn hàng này." and the button "Gửi yêu cầu"; on send the order stays "Chờ lấy hàng" with the banner "Đã gửi yêu cầu hủy. Đang chờ Shop phản hồi." and the action "Rút yêu cầu hủy".
- Given a pending cancel request, when the Demo control "accept" fires, then the order becomes "Đã hủy" with "Shop đã đồng ý hủy đơn"; when "refuse" fires, then the banner reads "Shop đã từ chối yêu cầu hủy. Đơn hàng sẽ tiếp tục được giao."; when I tap "Rút yêu cầu hủy" and confirm in the dialog, then the banner reads "Bạn đã rút yêu cầu hủy." In both the refused and withdrawn cases no cancel action is ever shown again for this order (rules.md#order-rules, one request per order).
- Given the sheet for any paid order, then above the button it states the refund before I confirm: VietQR "Tiền sẽ được hoàn về tài khoản ngân hàng đã thanh toán trong vòng 24 giờ.", wallet "Tiền sẽ được hoàn về ví điện tử đã thanh toán trong vòng 24 giờ.", card "Tiền sẽ được hoàn về thẻ đã thanh toán trong 7–14 ngày làm việc." with the amount ("Số tiền hoàn: 415.677₫"); for COD it says "Đơn hàng thanh toán khi nhận hàng nên không có khoản nào cần hoàn."; for `awaiting_payment` it says "Đơn hàng chưa được thanh toán nên không có khoản nào cần hoàn." Every variant adds "Voucher đã dùng cho đơn hàng này sẽ không được hoàn lại."
- Given a cancelled paid order, then the detail shows "Đang hoàn tiền" and, when the Demo control advances the refund, "Đã hoàn tiền · 415.677₫ · 19/11/2026" (US-ORD-002).
- Given an order in `shipping` or later, then no cancel action exists on the card or the detail (rules.md#order-rules), and opening the cancel sheet by any stale state shows "Đơn hàng không thể hủy ở trạng thái hiện tại." instead.

## UI states

- Empty: none; the sheet always has the reason list.
- Loading: the confirm button shows a spinner and the sheet stays open until the store answers (US-FND-003 latency); the sheet cannot be dismissed during it.
- Error: "Không hủy được đơn hàng. Vui lòng thử lại." inline in the sheet, reason kept; a status that changed meanwhile (a Demo control fired "Giao cho vận chuyển") closes the sheet and shows the toast "Trạng thái đơn hàng đã thay đổi." with the refreshed detail.
- Unavailable: cancel request already used (refused or withdrawn) → no action; `shipping` → no action.
- Overflow: "Tôi muốn thay đổi sản phẩm (phân loại, số lượng…)" wraps to 2 lines at 375 px with the radio aligned to the first line; the multi-order note with "(4 đơn)" fits; the refund line with `112.499.000₫` stays on one line.

## Design notes

- Web (≥ 1024): side panel from the right (US-FND-008), 440 wide, reasons as a radio list with 48 px rows, refund note in a muted block above the full-width black pill. Withdraw confirmation is a dialog (US-FND-010).
- App (< 1024): bottom sheet with drag handle, reasons list scrolls inside, the refund note and button pinned at the bottom above the safe area.
- The cancel-request banner on the detail sits inside the status block as a second line, ink text with a clock icon, not a warning colour; the refused banner uses the same weight, since the order simply continues.

## FE notes

- Overlay `cancel-sheet` on `/orders/:id` (sitemap.yaml), opened by `?sheet=cancel` so back closes it.
- Pure functions to TDD:
  - `cancelMode(order)` → `'immediate' | 'request' | 'withdraw' | 'none'` (the order transition rule for cancel: `awaiting_payment`, `to_confirm` → immediate; `to_ship` with no `cancelRequest` → request; `cancelRequest: pending` → withdraw; anything else, including `refused` and `withdrawn`, → none). Shares the table with `orderActions` (US-ORD-001).
  - `applyCancel(order, mode, now)` and `resolveCancelRequest(order, 'accept' | 'refuse' | 'withdraw')` → new order with status, `cancelledBy`, `cancelReason`, `cancelRequest`, a TrackingEvent, and `refundStatus: 'pending'` when `paymentStatus` is paid; calling request twice throws.
  - `refundCopy(paymentMethod, paymentStatus)` → the sheet sentence (rules.md#order-rules).
  - `ordersSharingPayment(order, orders)` for the multi-order note.
- Store actions `cancelOrder`, `requestCancel`, `withdrawCancel`; Demo controls (US-FND-004) call `resolveCancelRequest` and `completeRefund`.
- Enhanced by ORD P1: Return vouchers on cancellation; Cancel an order in `shipping`.

## Mock data

- Orders in `to_confirm` (COD), `awaiting_payment` (2 orders sharing one VietQR Payment), `to_ship` without a request (card), `to_ship` with `cancelRequest: pending`, and `to_ship` with `refused`.
- Demo control scenarios: accept and refuse the pending request; advance the refund of a cancelled paid order to `refunded`.

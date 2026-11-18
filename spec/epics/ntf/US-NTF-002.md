---
id: US-NTF-002
title: Notifications from order and voucher events
epic: NTF
priority: P0
status: Draft
size: M
routes: ["/notifications"]
dependsOn: [US-NTF-001, US-FND-004]
---

## Story

As a buyer, I want to be told when the shop, the carrier, the payment or Market changes something about my order, return or saved voucher, so that I never have to keep checking an order to find out it moved.

## Acceptance criteria

- Given an order changes status through an event the buyer did not cause (Demo controls or the system clock), then one `order` notification is written in the same store update, using these titles: paid → "Đặt hàng thành công"; `to_ship` → "Shop đã xác nhận đơn hàng"; `shipping` → "Đơn hàng đang được giao"; `delivered` → "Giao hàng thành công"; auto `completed` → "Đơn hàng đã hoàn thành"; payment expired → "Đơn hàng đã bị hủy"; failed delivery → "Giao hàng không thành công".
- Given each order notification, then its body names the order id and the next useful fact, for example "Đơn hàng MK240611000123 đã được giao. Bấm \"Đã nhận được hàng\" nếu bạn đã nhận đủ hàng." or "Đơn hàng MK240611000123 đã bị hủy vì giao hàng không thành công. Số tiền 330.448₫ sẽ được hoàn về Ví Sen." (refund wording and destination per rules.md#order-rules; a COD order says "Đơn thanh toán khi nhận hàng nên không phát sinh hoàn tiền."), and links to `/orders/:id`.
- Given the shop answers a cancel request, then the notification is "Shop đã đồng ý hủy đơn" or "Shop từ chối yêu cầu hủy đơn" with the body "Đơn hàng {id} sẽ tiếp tục được giao." for a refusal; given a refund completes ("Hoàn tiền xong" in Demo controls), then "Đã hoàn tiền {amount}" is written.
- Given a return request changes status through the shop or Market, then one `order` notification links to `/returns/:id`: `needs_evidence` → "Cần bổ sung bằng chứng", `awaiting_return_shipment` → "Yêu cầu trả hàng đã được chấp nhận" with "Vui lòng gửi hàng trả trước {date}." (rules.md#returns), `refunded` → "Đã hoàn tiền {amount}", `rejected` → "Yêu cầu trả hàng/hoàn tiền bị từ chối"; the buyer's own submit writes none.
- Given a saved, unused voucher enters its last 24 hours (on load, on the one-minute tick, or on a Demo controls clock jump), then exactly one `promotion` notification "Voucher sắp hết hạn" is written with the body "{offer} sẽ hết hạn lúc {time} {date}." linking to `/vouchers?voucher={id}`; it is never repeated for the same voucher.
- Given the buyer's own action (cancel at "Chờ xác nhận", "Đã nhận được hàng", submit a return, save a voucher), then no notification is written; the action's toast confirms it (US-FND-010).
- Given a notification is written, then the "Thông báo" badge in the header and tab bar increments within one second on every open window, including `/device`, and the matching tab count updates.

## UI states

- Empty: not applicable (generation has no UI); the list handles empty tabs (US-NTF-001).
- Loading: none; notifications arrive with the transition's own latency.
- Error: if building a notification throws, the whole transition rolls back and Demo controls show "Không thực hiện được" (US-FND-004); a transition never lands without its notification.
- Unavailable: transitions on a cancelled or completed order never generate notifications (illegal transitions throw before this point).
- Overflow: a 40-character shop name or `112.499.000₫` amount in a body still reads within two lines on the list; several notifications from a fast sequence of Demo controls each keep their own timestamp and order.

## Design notes

- No screen of its own; rows render in US-NTF-001 in both layouts. Badges are the US-FND-001 badge pills (ink, paper text), never red.
- Copy is factual and short, one next step per body, no exclamation marks, no emoji.

## FE notes

- `src/mock/notifications/build.ts`: `buildOrderNotification(order, event, ctx)`, `buildReturnNotification(request, event, ctx)`, `buildVoucherExpiringNotification(voucher, saved, now)` are pure and TDD with one test per template, including the COD/no-refund and paid/refund-destination branches and the "never repeated" rule (`notifiedExpiringIds` in state).
- Called from `transitionOrder`, `transitionReturn` and the clock tick inside the same store commit (US-FND-003); `isBuyerCaused(event)` (pure, TDD) gates generation.
- Money in bodies via `formatVnd`, dates via `formatDate`/`formatTime` (US-FND-002); kind mapping: order and return events → `order`, voucher → `promotion`, policy updates and seeded system messages → `system`.

## Mock data

- Seeded history of ~40 notifications consistent with the persona's orders (each status's notification exists for the orders that reached it); the 2-hour-expiry voucher saved in the seed so its "Voucher sắp hết hạn" appears on first load; a cancelled order paid by Ví Sen with refund pending for "Hoàn tiền xong".

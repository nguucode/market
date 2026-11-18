---
id: US-FND-004
title: Demo controls panel
epic: FND
priority: P0
status: Draft
size: M
routes: ["/", "/device"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a reviewer, I want one panel that plays the shop, the carrier, the payment gateway and the clock, so that I can push an order through every status, fail a delivery, approve a return or expire a voucher in seconds instead of waiting for counterparties that do not exist.

## Acceptance criteria

- Given the web layout, when I click "Demo controls" in the header, then a non-modal panel docks on the right without covering the main content column; given the app layout, when I tap the "Dữ liệu mẫu" badge (US-FND-009), then the same panel opens as a full-height sheet; on `/device` it is always open beside the frame (US-FND-005).
- Given the panel, then its header reads "Demo controls" with the line "Mô phỏng phía shop, đơn vị vận chuyển và cổng thanh toán. Không phải tính năng của Market." and the sections appear in this order, all from mock-data.md#demo-controls: "Đơn hàng", "Yêu cầu hủy", "Đặt hàng tiếp theo", "Thanh toán online tiếp theo", "Trả hàng/Hoàn tiền", "Đồng hồ", "Độ trễ", "Dữ liệu".
- Given "Đơn hàng", then an order picker preselects the order open on screen (`/orders/:id`) or else the newest order, shows "{id} · {status label}", and offers only the transitions legal from that status: "Shop xác nhận", "Giao cho vận chuyển", "Giao thành công", "Giao thất bại", "Hết hạn thanh toán" (object-model.md#order-state-machine); illegal ones are disabled with the reason inline, for example "Đơn đang ở trạng thái Đang giao". Given the order is cancelled, was paid online and its refund is pending, then "Hoàn tiền xong" sets its refund status to "Đã hoàn tiền" (rules.md#order-rules, used by US-ORD-003); otherwise it is disabled with "Không có khoản hoàn tiền đang chờ".
- Given an order with a pending cancel request, then "Yêu cầu hủy" offers "Shop đồng ý hủy" and "Shop từ chối"; with none, the section reads "Không có yêu cầu hủy đang chờ" and is disabled (rules.md#order-rules).
- Given "Đặt hàng tiếp theo", when I arm "Giá thay đổi khi đặt hàng" or "Hết hàng khi đặt hàng", then the next "Đặt hàng" (US-CHK-006) sees, respectively, a changed price on one selected line or one selected SKU out of stock; the control returns to "Bình thường" after that one place-order and shows "Áp dụng cho lần đặt hàng tiếp theo" while armed.
- Given "Thanh toán online tiếp theo", when I pick "Thất bại" or "Hết thời gian", then the next mock payment (US-CHK-007) ends that way and the control returns to "Thành công", showing "Áp dụng cho lần thanh toán tiếp theo" while armed.
- Given a return request, then "Trả hàng/Hoàn tiền" offers the actions legal from its status: "Duyệt hoàn tiền ngay", "Duyệt trả hàng", "Yêu cầu bổ sung bằng chứng", "Từ chối", then "Shop đã nhận hàng trả" and "Kiểm tra xong, hoàn tiền" (object-model.md#enums).
- Given "Đồng hồ", then "Bắt đầu khung flash sale tiếp theo" moves the clock to the next slot start and "Hết hạn voucher" (with a voucher picker over saved vouchers) moves that voucher's `endsAt` to now; "Dữ liệu" has "Đặt lại dữ liệu", which asks "Đặt lại toàn bộ dữ liệu mẫu?" before resetting the store and returning to `/`.

## UI states

- Empty: a section with nothing to act on is disabled with its reason ("Không có đơn trả hàng nào").
- Loading: the pressed button shows a spinner while the store action resolves (latency applies); other controls stay usable. On success the result shows inline under the button for 3 seconds (for example "MK240611000123 → Đang giao") and the affected screen updates without reload, including on `/device`.
- Error: an action that throws (illegal transition) shows "Không thực hiện được: {reason}" inline; the store is unchanged.
- Unavailable: none. Demo controls ignore buyer-side rules by design (they act as the counterparty).
- Overflow: about 25 orders in the picker, grouped by status label, searchable by id; the panel scrolls internally and every section is reachable on a 700px-tall window; order ids are monospace and never wrap.

## Design notes

- Web: 360px panel docked right under the header, 1px left hairline, a cool neutral surface (not the paper colour) so it reads as outside the product; sections divided by hairlines; actions as small outlined pills, never the black pill CTA.
- App: full-height sheet with a grab handle (US-FND-008 sheet, but not modal over the tab bar), same sections, 48px targets.
- Always tagged "Demo" in the header so screenshots never confuse it with buyer UI.

## FE notes

- `src/demo/DemoControls.tsx` calls `store.demo.*` actions only; it never mutates state directly. Each order action goes through `transitionOrder` (US-FND-003) so the notification (US-NTF-002) and tracking event are written in the same update.
- `legalOrderEvents(order)` and `legalReturnEvents(request)` are pure and TDD; the panel renders from them.
- Armed overrides (`nextPlaceOrderScenario: 'normal' | 'price_changed' | 'out_of_stock'`, `nextPaymentOutcome`, `latency`) are one-shot except latency; `store.checkout.placeOrder` reads and clears `nextPlaceOrderScenario` in the same update. They live in `store.demo` and persist like the rest of the state.
- Panel open/closed on web is per tab (`sessionStorage`).

## Mock data

- The persona's ~25 orders (every status present), a cancelled order paid by Ví Sen with refund pending, the COD order that failed delivery, the return request awaiting the shop, the 2-hour-expiry platform voucher, and the 4 flash-sale slots.

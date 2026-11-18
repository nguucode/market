---
id: US-ORD-002
title: Order detail with tracking timeline
epic: ORD
priority: P0
status: Draft
size: M
routes: ["/orders/:id"]
dependsOn: [US-ORD-001, US-FND-002, US-FND-004]
---

## Story

As a buyer, I want one page per order that tells me where the parcel is, exactly what I paid for and how, and what I can do now, so that I never have to guess about my money or my delivery.

## Acceptance criteria

- Given I open `/orders/:id`, then the title is "Chi tiết đơn hàng" and a status block at the top shows the status label (object-model.md#enums) with one plain sentence for it, e.g. "Chờ lấy hàng" + "Shop đang chuẩn bị hàng. Dự kiến giao 21/11 – 23/11.", "Đang giao" + "Đơn hàng đang trên đường đến bạn.", "Đã giao" + "Đơn hàng sẽ tự động hoàn thành vào 03/12/2026." (rules.md#order-rules), "Chờ thanh toán" + the payment countdown from US-ORD-005.
- Given the tracking timeline, then it lists every TrackingEvent newest first with time (`18/11/2026 14:05`), text, and location when present ("Lấy hàng thành công", "Đã đến kho Đà Nẵng", "Giao hàng thành công", "Giao hàng không thành công"); the newest event is ink and bold, older ones muted; the carrier option and fictional carrier name sit above it ("Nhanh · Giao Hàng Sao Mai"). Collapsed to the latest 3 events with "Xem thêm" when there are more.
- Given the address block "Địa chỉ nhận hàng", then it shows the `addressSnapshot` (name, `0905 123 456`, one-line address), and the payment block shows "Phương thức thanh toán" from the order; editing my saved address or default afterwards never changes either (rules.md#checkout-disclosures).
- Given the money block "Chi tiết thanh toán", then it lists "Tổng tiền hàng", "Phí vận chuyển", and each applied voucher on its own row by name and amount ("Voucher của Shop · Giảm 30.000₫ cho đơn từ 450.000₫  −30.000₫", "Voucher Market · Giảm 15% tối đa 50.000₫  −32.323₫", "Voucher miễn phí vận chuyển  −22.000₫"), then "Thành tiền 415.677₫" and "Giá đã bao gồm VAT"; values come from the order snapshot, never from current prices or vouchers.
- Given the order is `cancelled`, then the status block shows who and why ("Bạn đã hủy · Lý do: Tôi không có nhu cầu mua nữa" or "Giao hàng không thành công"), and a refund row: "Đang hoàn tiền" / "Đã hoàn tiền" with amount, destination, and expected time for a paid order, or "Đơn hàng thanh toán khi nhận hàng nên không có khoản nào cần hoàn." for COD (rules.md#order-rules).
- Given the order details block, then it shows "Mã đơn hàng" (`MK` + 12 digits) with "Sao chép" (toast "Đã sao chép"), "Thời gian đặt hàng", and each reached status timestamp ("Thời gian thanh toán", "Thời gian giao hàng", "Thời gian hoàn thành"), plus "Lời nhắn cho Shop" when present.
- Given the action bar, then it shows exactly the actions from `orderActions(order, now, …)` (US-ORD-001): "Thanh toán ngay", "Hủy đơn hàng", "Gửi yêu cầu hủy", "Rút yêu cầu hủy", "Đã nhận được hàng", "Trả hàng/Hoàn tiền", "Đánh giá", "Mua lại", "Xem chi tiết trả hàng", with the primary one as the black pill; "Tải hóa đơn" (US-ORD-007) sits in the details block, not the action bar.
- Given a Demo control fires a transition ("Shop xác nhận", "Giao cho vận chuyển", "Giao thành công", "Giao thất bại", "Hết hạn thanh toán"), then the status block, a new TrackingEvent at the top of the timeline, and the action bar update in place without a reload.

## UI states

- Empty: an unknown or malformed `:id` shows the not-found page (US-FND-006); an order with a single TrackingEvent ("Đơn hàng đã được đặt") shows the timeline with that one row, no "Xem thêm".
- Loading: status block, timeline, and money block skeletons in the final layout.
- Error: "Không tải được đơn hàng." with "Thử lại".
- Unavailable: a delisted product in a line keeps its snapshot name and image but is not a link and shows "Sản phẩm không còn bán"; a line bought at flash-sale price shows that snapshot price, struck-through `priceBeforePromo` included.
- Overflow: 40-character shop name wraps to 2 lines in the shop row; 120-character product name clamps to 2 lines in the line list (full name in the link title); a 5-line order lists all 5 lines (no "+N" on the detail); 11-character prices and the `112.499.000₫` total stay right-aligned on one line at 375 px; 12 tracking events collapse behind "Xem thêm".

## Design notes

- Web (≥ 1024): two columns inside max-width 1120. Left (wide): status block, tracking timeline (vertical, 8 px dots on a 1 px rail), then the shop group with its lines. Right (360, sticky): address, payment method, "Chi tiết thanh toán", details block, and the action pills stacked full width. Back link "Đơn mua" above the title.
- App (< 1024): single column, header back to `/orders` + "Chi tiết đơn hàng", tab bar hidden. Order: status block (tinted band in an editorial light pair, not a status colour), latest tracking event as one row that expands to the full timeline in a bottom sheet (US-FND-008), address, lines, money, details. Actions in a sticky bottom bar: primary black pill right, at most one outlined pill left, the rest in a "Thêm" sheet.
- Money rows: label left, amount right, tabular numerals; voucher rows in the deal colour, never red; "Thành tiền" bold 16 px.

## FE notes

- Route `/orders/:id`; `OrderPage` with `OrderStatusBlock`, `TrackingTimeline`, `OrderLines`, `AddressSnapshot`, `PaymentBreakdown`, `OrderDetails`, `OrderActionBar`. Overlays `cancel-sheet` and `confirm-received-dialog` are owned by US-ORD-003 and US-ORD-004.
- Pure functions to TDD:
  - `orderActions(order, now, ctx)` (shared, US-ORD-001).
  - `statusSentence(order, now)` → the status block copy, including the auto-complete date (`deliveredAt` + rules.md#order-rules days).
  - `paymentRows(order)` → rows from the snapshot only, one per AppliedVoucher, asserting `goods + shipping − Σ vouchers === total` (throws in dev if the snapshot is inconsistent).
  - `refundInfo(order)` → `{ kind: 'none_cod' | 'none_unpaid' | 'pending' | 'refunded', amount, destinationCopy, eta }` from `paymentMethod`, `paymentStatus`, `refundStatus` (rules.md#order-rules).
- `PaymentBreakdown` is shared with US-ORD-007 and the RET confirm step.
- Store subscription for Demo control transitions (US-FND-004); `TrackingEvent` appended by the store, sorted desc in the view.

## Mock data

- Shop A order from the worked example without Xu (rules.md#voucher-math item 7): lines 2 × 149.000₫ and 1 × 180.000₫, shop voucher −30.000₫, platform share −32.323₫, shipping 22.000₫ fully covered, total 415.677₫, paid by VietQR, status `shipping` with 5 events.
- A cancelled COD order with "Giao hàng không thành công"; a cancelled card order with `refundStatus: pending`; a cancelled VietQR order with `refunded`.
- An order whose saved address was edited after ordering (snapshot differs from the current address) and one with a delisted product line.

---
id: US-ORD-001
title: Orders list by status
epic: ORD
priority: P0
status: Draft
size: M
routes: ["/orders"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003, US-FND-009]
---

## Story

As a buyer, I want all my orders in one list I can narrow by status, with the one thing I need to do next on each card, so that I can see at a glance what is on its way, what waits on me, and what went wrong.

## Acceptance criteria

- Given I open `/orders`, then the title is "Đơn mua" and I see tabs in this order with a count after each: "Tất cả", "Chờ thanh toán", "Chờ lấy hàng", "Đang giao", "Đã giao", "Đã hủy", "Trả hàng/Hoàn tiền"; the active tab is `?status=` (`all`, `awaiting_payment`, `to_ship`, `shipping`, `delivered`, `cancelled`, `returns`), default `all`, and an unknown value falls back to `all`.
- Given the tab mapping, then "Chờ lấy hàng" holds `to_confirm` and `to_ship`, "Đã giao" holds `delivered` and `completed`, and "Trả hàng/Hoàn tiền" holds `return_requested` and `returned`; an order appears in exactly one status tab plus "Tất cả". Counts show only on "Chờ thanh toán", "Chờ lấy hàng", "Đang giao", and "Trả hàng/Hoàn tiền" while non-zero (they are things in progress); "Tất cả", "Đã giao", and "Đã hủy" never show a count.
- Given an order card, then it shows the shop name (with the "Shop chính hãng" badge when official) linking to `/s/:handle`, the status label on the right ("Chờ thanh toán", "Chờ xác nhận", "Chờ lấy hàng", "Đang giao", "Đã giao", "Hoàn thành", "Đã hủy", or the ReturnRequest label such as "Market đang xem xét"), the first line (image, name, "Phân loại: Đen, 11oz", "x2", unit price), "+2 sản phẩm" when there are more lines, and "Thành tiền: 415.677₫" for the order total.
- Given an order card, then it shows at most one primary action from `orderActions(order, now)`: "Thanh toán ngay" (`awaiting_payment`, US-ORD-005), "Đã nhận được hàng" (`delivered`, US-ORD-004), "Đánh giá" (window open with unreviewed lines, US-REV-002), "Mua lại" (`completed` after reviewing, or `cancelled`, US-ORD-006), "Xem chi tiết trả hàng" (returns tab, opens `/returns/:id`); every other status shows "Xem chi tiết". Tapping anywhere else on the card opens `/orders/:id`.
- Given a `to_ship` order with a pending cancel request, then the card adds the line "Đang chờ Shop phản hồi yêu cầu hủy" under the status (US-ORD-003); given a `cancelled` order, then the card adds who cancelled: "Bạn đã hủy", "Shop đã hủy", or "Hệ thống đã hủy".
- Given more than 10 orders in a tab, then the list loads 10 at a time as I scroll, newest `createdAt` first, until every order is shown; no order is ever hidden by age (rules.md#order-rules).
- Given a demo control changes an order's status while the list is open, then the card moves to its new tab and the counts update without a reload.

## UI states

- Empty: per tab, an illustration and "Chưa có đơn hàng" with the pill "Tiếp tục mua sắm" to `/`; the seed never leaves "Tất cả" empty, so that state is covered by a unit test with an empty store.
- Loading: 3 card skeletons in the final layout; tabs and counts render from the store at once (US-FND-003 latency applies to the list only).
- Error: "Không tải được đơn hàng." with "Thử lại" (US-FND-009); tabs stay usable.
- Unavailable: a line whose product is now delisted still shows its snapshot name and image (the order is history); no "Mua lại" on such an order if every line is delisted (US-ORD-006 decides).
- Overflow: 40-character shop name truncates with an ellipsis before the status label, which never wraps; the 120-character product name clamps to 2 lines; the largest total `112.499.000₫` stays on one line at 375 px; tab bar scrolls horizontally on app with the active tab scrolled into view.

## Design notes

- Web (≥ 1024): account area with the left account menu ("Đơn mua" active), content max-width 960. Tabs as an underlined text row (ink underline on active, counts in parentheses), cards stacked with 16 px gap, each a plain block on the paper background separated by a 1 px hairline, not a boxed card (the reference study's borderless grammar). Primary action as the black pill on the right of the total row, "Xem chi tiết" as an outlined pill.
- App (< 1024): header back + "Đơn mua", tab bar hidden; status tabs as a horizontally scrolling chip row pinned under the header. Card is full-bleed with 16 px gutters; total row and action pill on one line, pill 40 px high.
- Status label in ink for normal progress, the muted ink for "Đã hủy", never red; "Chờ thanh toán" may use the deal colour since it asks for action.
- Serif only for the page title "Đơn mua"; cards are all sans.

## FE notes

- Route `/orders?status=`; `OrdersPage` with `OrderStatusTabs`, `OrderCard`, `OrderCardPrimaryAction`; infinite list via the shared pattern from US-FND-009.
- Pure functions to TDD:
  - `orderTab(order)` → tab id (the mapping above), and `tabCounts(orders)`.
  - `orderActions(order, now, { returnRequest, reviews })` → ordered list of allowed actions for the status (shared with US-ORD-002 and every action story; this is the order transition table: `awaiting_payment` → pay, cancel; `to_confirm` → cancel; `to_ship` → requestCancel only when `cancelRequest` is unset, withdraw when pending; `shipping` → none; `delivered` → confirmReceived, return, review; `completed` → return while in window, review while in window, buyAgain; `cancelled` → buyAgain). `primaryAction(actions)` picks the card action.
- Sort by `createdAt` desc, ties by id. Counts come from the whole store, not the loaded page.
- Store subscription so Demo control transitions (US-FND-004) re-render the list.

## Mock data

- The persona's ~25 orders over 6 months covering every status (ia/mock-data.md): at least one per tab, the COD order that failed delivery, the return awaiting the shop, a `to_ship` order with a pending cancel request, one with a refused request.
- An order with 5 lines (for "+4 sản phẩm"), one with the 40-character shop name, one with the 120-character product name, one with the largest total (`112.499.000₫`, paid by card).
- Two unpaid orders from one online checkout (same Payment) to show they share one countdown.

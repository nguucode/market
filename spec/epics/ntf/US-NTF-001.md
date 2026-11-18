---
id: US-NTF-001
title: Notifications list with tabs
epic: NTF
priority: P0
status: Draft
size: S
routes: ["/notifications"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a buyer, I want one list of what happened to my orders and offers, split by kind and with the new ones marked, so that I can catch up in a few seconds and jump straight to what needs me.

## Acceptance criteria

- Given I open `/notifications`, then the page titled "Thông báo" shows tabs "Đơn hàng", "Ưu đãi", "Hệ thống" (`?tab=orders|promotions|system`, default `orders`), each with its unread count in brackets when above zero ("Đơn hàng (3)").
- Given a tab, then its notifications are listed newest first; each row shows a thumbnail (first product image for order and return events, the voucher's offer block for voucher events, a neutral Market mark for system), the title, the body clamped to two lines, and the time via US-FND-002 ("2 giờ trước" under 24 hours, else "18/11/2026 14:05"); unread rows have a dot and a bold title.
- Given I tap a row, then it is marked read and I go to its `link` (`/orders/:id`, `/returns/:id`, `/vouchers?voucher={id}`, `/p/:slug`); the header and tab bar badges update at once (US-FND-001).
- Given unread rows in the current tab, when I press "Đánh dấu đã đọc", then every notification in that tab becomes read and the button is disabled with no confirmation; other tabs are unchanged.
- Given a row whose link target no longer exists (deleted voucher, unknown order), when I tap it, then it is marked read and the target's not-found page explains it (US-FND-006); the list never hides such rows.
- Given about 40 notifications, then the tab shows 20 and loads the next 20 with "Xem thêm"; nothing is truncated or dropped by age.

## UI states

- Empty: per tab, "Chưa có thông báo nào" with the line "Cập nhật về đơn hàng sẽ xuất hiện ở đây." (orders), "Ưu đãi dành cho bạn sẽ xuất hiện ở đây." (promotions), "Thông báo từ Market sẽ xuất hiện ở đây." (system).
- Loading: 8 row skeletons; tabs render immediately with counts filled when the store resolves.
- Error: full error state with "Thử lại" (US-FND-009); marking read that fails reverts the row and shows the toast "Không cập nhật được. Vui lòng thử lại."
- Unavailable: rows linking to a delisted product open its PDP, which handles delisting.
- Overflow: titles with a 14-character order id and a 40-character shop name wrap to two lines; bodies clamp to two lines with "…"; unread counts above 99 read "(99+)".

## Design notes

- Web (≥ 1024): content column max-width 720 centred, serif heading "Thông báo" 36px, tabs as an underline row with "Đánh dấu đã đọc" as a text button at the right of the tab row; rows 80px with a 56px thumbnail (8px radius, 4:5 crop for products), hairline separators, unread dot in ink (not a colour).
- App (< 1024): tab route, tab bar visible with the "Thông báo" badge; header title "Thông báo" with "Đánh dấu đã đọc" as an icon button (accessible name "Đánh dấu đã đọc"); tabs sticky under the header; rows full width, 48px thumbnail.
- Unread is shown by weight and a dot, never by a coloured row background.

## FE notes

- `src/screens/notifications/NotificationsPage.tsx`, `?tab=` via search params.
- Store: `store.notifications.list({ kind, page })`, `markRead(id)`, `markAllRead(kind)`; selector `selectUnreadCount(kind?)` feeds the tabs and the badges.
- Pure and TDD: `groupUnread(notifications)` → counts per kind; `notificationThumb(notification, catalog, vouchers)`.

## Mock data

- ~40 seeded notifications over 6 months, latest 6 unread (mock-data.md#scale), spread over the three kinds, including one linking to a voucher that has since expired and one linking to the delisted product.

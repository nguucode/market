---
code: NTF
name: Notifications
route: /notifications
summary: The notifications list with Đơn hàng, Ưu đãi and Hệ thống tabs, read state and badges, and the notifications the store generates from order transitions, cancel and return outcomes, and saved vouchers about to expire.
---

# NTF · Notifications

Notifications close the loop that Demo controls open. When a reviewer plays the shop or the carrier ("Shop xác nhận", "Giao thành công", "Shop từ chối"), the buyer learns about it the way a VN marketplace buyer does: a badge on "Thông báo", a line in the right tab, and one tap to the order. Only events the buyer did not cause produce a notification; the buyer's own actions are confirmed by a toast on the spot. Notifications are written in the same store update as the transition that caused them, so a badge never appears before the order has changed. Push, email and settings are out of scope for a front-end demo.

## P0 stories

- US-NTF-001 — Notifications list with tabs
- US-NTF-002 — Notifications from order and voucher events

## P1 backlog

| Title | Why P1 |
|---|---|
| Notification settings (turn categories on or off) | No real channel to configure in a front-end demo. |
| Header popover with the latest notifications (web) | The bell links to the page in P0; a popover duplicates the list. |
| Flash-sale reminders ("Nhắc tôi") as notifications | Depends on PRM P1 reminders. |
| Review reply and review reward notifications | Shop replies and Xu are P1 (rules.md#voucher-math item 8). |
| Delete or archive a notification | Read state is enough for the demo; history is never truncated in spirit with rules.md#order-rules. |
| Browser push via the Notification API | Needs permission prompts that distract from the demo. |

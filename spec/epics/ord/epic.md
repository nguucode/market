---
code: ORD
name: Orders
route: /orders
summary: Đơn mua list by status, order detail with tracking timeline and money snapshot, cancel and cancel request, confirm received, pay an unpaid order, buy again, and the printable invoice.
---

# ORD · Orders

Everything the buyer sees and does after "Đặt hàng". One checkout with n shops created n orders (rules.md#order-rules), so every screen here is per order, per shop. The order is a snapshot: address, prices, each voucher by name, fees, and payment method are shown as they were at the time of order and never recalculated (rules.md#checkout-disclosures). Every status change comes from the mock store, and the reviewer fires it from Demo controls (object-model.md#order-state-machine). The allowed actions per status live in one pure function shared by the list, the detail, and every action story, so a button can never appear on a card and be refused on the detail. History is never truncated (rules.md#order-rules).

## P0 stories

- US-ORD-001 — Orders list by status
- US-ORD-002 — Order detail with tracking timeline
- US-ORD-003 — Cancel an order
- US-ORD-004 — Confirm received
- US-ORD-005 — Pay for an unpaid order
- US-ORD-006 — Buy again
- US-ORD-007 — Printable order invoice

## P1 backlog

| Title | Why P1 |
|---|---|
| Cancel an order in `shipping` | rules.md#order-rules: no cancel once the carrier has the parcel in P0; the source allows it only for some carriers and some users. |
| Return vouchers on cancellation | Restoring a platform voucher when every order that shared it is cancelled needs voucher re-split logic; P0 says plainly that vouchers on a cancelled order are not returned. |
| Xu refunds on cancellation | Xu is P1 (rules.md#voucher-math item 8); nothing to refund until Xu exists. |
| Change the payment method of an unpaid order | P0 pays with the method chosen at checkout; switching needs a new Payment and voucher re-check (rules.md#voucher-math item 2). |
| Chat with the shop (Liên hệ Shop) | Chat is P1 across the product; order actions work without it. |
| Search inside Đơn mua | 25 seeded orders fit in tabs; search pays off only with a long history. |
| Change the delivery address before pickup | Needs a shop-approval round like the cancel request; not in the demo loop. |
| Product recall notice on purchased orders (Thu hồi sản phẩm) | Luật TMĐT Đ.17 k.2 asks for direct notice; research marks it P2-level, needs a recall object and an NTF kind. |
| Choose a refund destination on cancel (wallet vs bank) | P0 refunds follow the paid method (rules.md#order-rules); a choice adds a step nobody needs in the demo. |

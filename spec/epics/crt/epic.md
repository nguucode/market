---
code: CRT
name: Cart
route: /cart
summary: Cart lines grouped by shop, line and shop selection with a totals bar, quantity and variant edits, unavailable and changed lines, and the shop voucher with its "Mua thêm" nudge.
---

# CRT · Cart

The cart is the first half of the pricing engine. Lines are stored flat and grouped by shop only in the UI (object-model.md); every number the cart shows comes from the same pure functions that checkout uses, so the cart total for the selected lines always equals the goods-minus-shop-voucher part of the checkout breakdown. The reference study gives the layout grammar: one group per shop with that shop's estimated shipping and delivery date, a sticky totals column on web, a black pill CTA, and the calm deal colour for savings. Shop vouchers live inside each shop group; platform and shipping vouchers are chosen at checkout (CHK).

## P0 stories

- US-CRT-001 — Cart grouped by shop
- US-CRT-002 — Select lines and the totals bar
- US-CRT-003 — Change quantity, change variant, and remove
- US-CRT-004 — Unavailable and changed lines
- US-CRT-005 — Apply a shop voucher in the cart

## P1 backlog

| Title | Why P1 |
|---|---|
| Save for later ("Để mua sau") | The demo loop never needs to park a line; Yêu thích already covers "keep it for later". |
| Platform and shipping vouchers in the cart totals column | Checkout already holds both slots (US-CHK-005); showing them twice doubles the state to keep in sync. |
| "Tìm sản phẩm tương tự" for unavailable lines | Needs a similarity query the mock catalogue does not model; removal is enough for the demo. |
| Bulk edit mode on app ("Sửa": multi-select and delete) | Per-line remove covers the demo; bulk delete is a convenience. |
| Add-on deals inside a shop group ("Mua kèm deal sốc") | A promotion type outside rules.md#voucher-math; adds a fourth discount layer. |
| Price-drop note on lines ("Giảm {x}₫ từ khi thêm vào giỏ") | Nice signal, but US-CRT-004 already handles the price-up case the law cares about. |

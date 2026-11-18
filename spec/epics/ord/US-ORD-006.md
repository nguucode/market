---
id: US-ORD-006
title: Buy again
epic: ORD
priority: P0
status: Draft
size: S
routes: ["/orders", "/orders/:id"]
dependsOn: [US-ORD-002, US-CRT-001]
---

## Story

As a buyer, I want to put the items of a past order back in my cart in one tap, at today's price and with anything no longer sold left out and named, so that reordering is fast and honest.

## Acceptance criteria

- Given an order in `completed` or `cancelled`, then "Mua lại" is available on its card (US-ORD-001) and the detail (US-ORD-002); it is hidden when every line's product is delisted.
- Given I tap "Mua lại", then each line's SKU is added to the cart with the same quantity (merged into an existing cart line for the same SKU, capped at stock), only those lines are selected, and I land on `/cart` with the shop group in view.
- Given some lines cannot be added (product delisted, SKU out of stock), then the others are added and the toast says "Đã thêm 2 sản phẩm vào giỏ. 1 sản phẩm đã hết hàng hoặc không còn bán."; given none can be added, then nothing changes and the toast says "Các sản phẩm trong đơn này hiện không còn bán."
- Given a quantity is above current stock, then the line is added at the stock count and the cart line shows "Chỉ còn 3 sản phẩm" (US-CRT-001 owns the copy).
- Given the price today differs from the order snapshot, then the cart shows today's price; a flash-sale price from the old order is never carried over (rules.md#price-display).

## UI states

- Empty: none.
- Loading: the button shows a spinner during the add (store latency); double taps are ignored.
- Error: "Không thêm được vào giỏ. Vui lòng thử lại." toast; cart unchanged.
- Unavailable: delisted or out-of-stock lines as above.
- Overflow: a 5-line order adds 5 lines; the toast stays one line by giving counts, never product names.

## Design notes

- Web (≥ 1024): "Mua lại" outlined pill on the card, black pill on a cancelled or reviewed completed order's detail.
- App (< 1024): same pill in the card's action row and in the detail's sticky bottom bar.
- Navigate to the cart rather than a "view cart" toast, because the buyer's intent is to buy now.

## FE notes

- Pure function to TDD: `buyAgainPlan(order, catalogue, cart)` → `{ add: [{ skuId, qty }], skipped: [{ lineId, reason: 'delisted' | 'out_of_stock' }], capped: [...] }`; the store action `cart.addMany(plan.add, { select: 'only' })` is owned by CRT and reused.
- Copy built by `buyAgainToast(plan)` with the counts.

## Mock data

- A completed order with 3 lines where one product is delisted and one SKU now has stock 3 against an ordered qty 4.
- A cancelled order whose SKU price rose since ordering, and one that was bought in a flash-sale slot.

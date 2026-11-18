---
code: CHK
name: Checkout
route: /checkout
summary: One-page checkout with a block per shop, delivery address, shipping option per shop, payment method, platform and shipping vouchers, the itemised "Chi tiết thanh toán", place order with last-moment checks, the mock online payment page, and the result listing one order per shop.
---

# CHK · Checkout

Checkout is the core of the demo and the second half of the pricing engine. It is one editable page, not a wizard, because Luật TMĐT Đ.12 requires the buyer to review and change items, delivery, promotions, money breakdown, and payment method before ordering (rules.md#checkout-disclosures). All money comes from one pure, test-driven function, `priceCheckout`, that applies the three voucher slots in the order of rules.md#voucher-math and splits session discounts per shop by largest remainder, so the n orders created always sum to the session total. Online methods share one Payment with a 15-minute expiry (rules.md#payment); the demo controls decide the payment outcome.

## P0 stories

- US-CHK-001 — Checkout page
- US-CHK-002 — Choose or add the delivery address
- US-CHK-003 — Shipping option per shop
- US-CHK-004 — Payment method
- US-CHK-005 — Platform and shipping vouchers at checkout
- US-CHK-006 — Place order with last-moment checks
- US-CHK-007 — Online payment page with expiry
- US-CHK-008 — Order placed result

## P1 backlog

| Title | Why P1 |
|---|---|
| Xu (coins) toggle "Dùng {n} Xu" | rules.md#voucher-math item 8: the engine already takes `coins` (default 0); the UI toggle, balance, and daily caps are P1. |
| Installment ("Trả góp") | rules.md#payment lists it as P1; needs a provider and term picker the mock does not model. |
| Enter a voucher code ("Nhập mã voucher") | Saved and listed vouchers cover the demo; free-text codes add validation states without new pricing. |
| Change payment method after placing an online order | P0 retries the same method until expiry; switching methods means re-checking method-restricted vouchers on placed orders. |
| Company e-invoice request ("Yêu cầu xuất hóa đơn") | Needs tax-code fields and a seller workflow outside the buyer demo; the printable invoice is in ORD. |
| Check out one shop only from a multi-shop cart | Line selection in the cart already does this. |

---
code: PRM
name: Promotions
route: /vouchers
summary: The flash sale page with slot tabs and sold bars, claiming vouchers ("Lưu") and the voucher hub "Kho voucher" with its tabs, and the voucher conditions sheet shared by every surface that shows a voucher.
---

# PRM · Promotions

Promotions owns the two deal mechanics a VN buyer expects and the reference study's grammar does not have: time-boxed flash-sale slots and tiered vouchers. The flash sale page (`/flash-sale`) shows today's and tomorrow's slots as tabs, each item with its slot price in the deal colour and a quiet sold bar; nothing flashes. The voucher hub (`/vouchers`, "Kho voucher") is where a buyer saves ("Lưu") and finds platform, shop and shipping vouchers. The claim behaviour and the voucher tile are defined once here and reused by Home (US-HOM-004), the product page (US-PDP-010), the shop page (US-SHP-003) and the cart. The conditions sheet (US-PRM-003) states every condition a voucher carries, so no surface ever hides a minimum, a cap, a payment restriction or a scope. How a voucher is applied and computed is not here: that is rules.md#voucher-math, applied by CRT and CHK.

## P0 stories

- US-PRM-001 — Flash sale page
- US-PRM-002 — Claim vouchers and the voucher hub
- US-PRM-003 — Voucher conditions sheet

## P1 backlog

| Title | Why P1 |
|---|---|
| "Nhắc tôi" reminders for upcoming flash-sale slots | Sitemap marks it P1; needs a notification scheduled against the clock, nothing in the demo loop reads it. |
| Enter a voucher code by hand ("Nhập mã voucher") | Saving from tiles covers the loop; free-text codes add validation states with no new learning. |
| Voucher history (used and expired vouchers) | P0 hides expired and used-up vouchers; history matters only after many sessions. |
| Xu (coins) balance and rules page | rules.md#voucher-math item 8 makes Xu P1. |
| Category campaign pages (LazMall-style channels) | The category row and search filters already cover official shops and sales. |
| Bundle deals and "Mua kèm deal sốc" | Adds a fourth discount layer to the math; no source for its stacking order. |

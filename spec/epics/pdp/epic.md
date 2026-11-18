---
code: PDP
name: Product page
route: /p/:slug
summary: Product page layout and gallery, the price block with sale, range, and flash-sale price, the chip variant picker with stock per combination, add to cart and buy now, shipping estimate, shop card, details with specs and policies, reviews, favourites, and shop vouchers.
---

# PDP · Product page

The page where a buyer decides. It keeps the reference study's calm right column (serif name, one price block, black pill CTA, trust lines) and adds what a VN marketplace buyer expects before paying: a chip picker that shows which Phân loại combinations are in stock and swaps the photo, the flash-sale price with its per-buyer limit, the shop's vouchers, the shipping fee and delivery dates to my address, and the legal disclosures (seller information, Thông số, Chính sách) in collapsed sections. Web puts the picker inline; app uses a sticky bottom bar that opens the variant sheet. Price display follows rules.md#price-display exactly; this Epic never invents a price rule.

## P0 stories

- US-PDP-001 — Product page layout and image gallery
- US-PDP-002 — Price block with sale, range, and flash-sale price
- US-PDP-003 — Variant picker with stock per combination
- US-PDP-004 — Add to cart and Buy now
- US-PDP-005 — Shipping estimate to my address
- US-PDP-006 — Shop card and more from this shop
- US-PDP-007 — Product details and attributes
- US-PDP-008 — Reviews summary and full reviews page with filters
- US-PDP-009 — Add to and remove from favourites
- US-PDP-010 — Shop vouchers on the product page

## P1 backlog

| Title | Why P1 |
|---|---|
| Chat with the shop (bottom-bar "Chat ngay") | sitemap.yaml marks chat P1; needs a conversation model the demo loop does not use. |
| Product video in the gallery | Optional `video` field; photos carry the demo. |
| Similar products rail ("Sản phẩm tương tự") | Needs a similarity rule; "more from this shop" and search cover browsing in P0. |
| Recently viewed products | Needs cross-page view tracking; not in the loop. |
| Share product link | Browser share works on the URL already; a share sheet is polish. |
| Note to shop per line ("Ghi chú cho shop") for personalised items | Research §7.1 maps personalisation here; few VN categories need it. |
| Mark a review helpful | Adds a counter and a sort temptation; reviews are read-only in P0. |
| Notify me when back in stock | Needs a notification trigger from stock changes; NTF P0 covers order and voucher events only. |

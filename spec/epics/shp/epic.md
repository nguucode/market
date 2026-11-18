---
code: SHP
name: Shop
route: /s/:handle
summary: Shop page header with follow, shop products with shop categories, search, and sort, the shop vouchers row, and the reviews and About tabs with seller information.
---

# SHP · Shop

The shop page is the trust page: who this shop is, how it behaves, and what else it sells. It follows the reference study's shop grammar (banner, avatar, serif name, a quiet line of facts, tabs) and adds the VN parts: the "Shop chính hãng" badge, response rate, a shop vouchers row, shop categories, and the legally required "Thông tin người bán" with "Đã xác thực" (rules.md#seller-and-product-disclosures). Tabs live in `?tab=` so every tab is a shareable URL on both layouts.

## P0 stories

- US-SHP-001 — Shop header with follow
- US-SHP-002 — Shop products with shop categories, search, and sort
- US-SHP-003 — Shop vouchers row
- US-SHP-004 — Shop reviews and About with seller information

## P1 backlog

| Title | Why P1 |
|---|---|
| Chat with the shop ("Chat ngay") | Chat is P1 across Market (sitemap.yaml); needs a conversation model. |
| Followed shops list (Yêu thích › Shop) | sitemap.yaml `favorites` marks the Shops tab P1; following works in P0 without a list. |
| Decorated shop home (banners, collections chosen by the shop) | A seller-side curation model the mock does not need for the loop. |
| Report the shop ("Tố cáo Shop") | Needs a report flow and moderation outcome; not in the demo loop. |
| Shop policies tab (shipping, returns per shop) | Market uses one platform return policy (rules.md#returns); per-shop policy adds no P0 behaviour. |
| Shop sale event page (shop-level flash sale) | Flash sale is platform-level in P0 (PRM). |

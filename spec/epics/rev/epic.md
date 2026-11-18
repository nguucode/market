---
code: REV
name: Reviews
route: /orders/:id/review
summary: Write a review per line item of a delivered order (stars, three sub-ratings, tags, text, up to 5 photos, anonymous), edit it once, and the review prompts and window on order cards and the order detail.
---

# REV · Reviews

The last step of the demo loop. A review belongs to one purchased line (one SKU of one order), can be written from `delivered` until the window in rules.md#reviews closes, and is edited at most once before the shop replies. The buyer's own review lands in the product's review list at the top of the default "Mới nhất" sort, never filtered or reordered by rating (rules.md#reviews), which is why an order with an open return can still be reviewed. Reading reviews on the product page belongs to PDP; this Epic only writes them and prompts for them.

## P0 stories

- US-REV-001 — Write a review for a delivered order
- US-REV-002 — Review prompts and review status on orders

## P1 backlog

| Title | Why P1 |
|---|---|
| My reviews page (Đánh giá của tôi) | Listed P1 in sitemap.yaml (`/me/reviews`); reviews are reachable from each order in P0. |
| Review edit history | P0 allows one edit and keeps only the latest text; showing "Đã chỉnh sửa" history needs versioned reviews. |
| Video in reviews | Mock upload of video adds file handling with no demo value over photos. |
| Xu reward for reviews | Xu is P1 (rules.md#voucher-math item 8); the reward rules (min characters, photo bonus) come with it. |
| Notification when the shop replies | NTF P0 covers order and voucher events only; shop replies are seeded, not live. |
| Delete my review | Not offered by the reference marketplaces in a way the research confirmed; risks conflicting with the never-hide rule. |

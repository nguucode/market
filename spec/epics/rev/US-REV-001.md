---
id: US-REV-001
title: Write a review for a delivered order
epic: REV
priority: P0
status: Draft
size: M
routes: ["/orders/:id/review"]
dependsOn: [US-ORD-002, US-FND-010]
---

## Story

As a buyer who received an order, I want to rate and describe each item I bought, with photos and without my name if I prefer, so that other buyers get an honest picture and the shop hears from me.

## Acceptance criteria

- Given I open `/orders/:id/review` for an order where `canReview` is true (rules.md#reviews), then the title is "Đánh giá sản phẩm" and there is one block per line not yet reviewed, each with the product image, name, and "Phân loại: Đen, 11oz"; lines already reviewed show their review read-only below, with "Sửa đánh giá" if not yet edited and the shop has not replied.
- Given a block, then the overall stars (1–5, required, no label above them) show a label after selection ("Tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời"), and "Thêm đánh giá chi tiết" expands the three optional sub-ratings "Chất lượng sản phẩm", "Giao hàng", "Phục vụ của shop" as 1–5 stars each.
- Given I pick stars, then quick tags appear as toggle chips: 4–5 stars "Chất lượng tốt", "Đúng mô tả", "Đóng gói cẩn thận", "Giao hàng nhanh", "Đáng tiền"; 1–3 stars "Không đúng mô tả", "Chất lượng kém", "Đóng gói sơ sài", "Giao hàng chậm", "Shop phản hồi chậm"; changing the stars across that boundary clears tags that no longer apply.
- Given the text field, then the placeholder is "Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé", it is optional, max 1.000 characters with a counter "0/1.000"; given the photos, then "Thêm ảnh (0/5)" allows up to 5 (local mock upload, removable), and the add tile disappears at 5.
- Given the anonymous switch "Đánh giá ẩn danh", then when on, a helper shows how my name will appear ("Tên của bạn sẽ hiển thị là L***à"); off by default.
- Given at least one block has stars, when I tap "Gửi đánh giá", then a Review per rated line is saved with `skuId`, `isMine: true`, `createdAt` now, the toast "Cảm ơn bạn đã đánh giá!" shows, I return to `/orders/:id`, and each review appears first on its product's review list under the default sort "Mới nhất" (US-PDP-008); blocks left without stars stay unreviewed for later.
- Given I leave with unsaved input, then the dialog "Bỏ đánh giá đang viết?" with "Bỏ" and "Tiếp tục viết" (US-FND-010) stops me once.
- Given "Sửa đánh giá" on a reviewed line, then the same block opens prefilled; saving replaces the review, marks it `edited`, and the action never shows again for that review; after a shop reply the review is read-only with "Shop đã phản hồi" (rules.md#reviews).

## UI states

- Empty: every line reviewed and no edit left → the page shows the read-only reviews with "Bạn đã đánh giá tất cả sản phẩm trong đơn hàng này."
- Loading: blocks skeleton; "Gửi đánh giá" spinner while saving; photo thumbnails shimmer while the mock upload resolves.
- Error: save fails → "Không gửi được đánh giá. Vui lòng thử lại." with every input kept; invalid photo → "Ảnh không hợp lệ (tối đa 10 MB, định dạng JPG, PNG, HEIC)."
- Unavailable: window closed or status not reviewable (`awaiting_payment`, `to_confirm`, `to_ship`, `shipping`, `cancelled`) → redirect to `/orders/:id` with the toast "Đơn hàng này không thể đánh giá."; a delisted product can still be reviewed (snapshot name and image).
- Overflow: a 5-line order shows 5 blocks with the submit button always reachable (sticky); the 120-character name clamps to 2 lines; 10 tags wrap to 2–3 rows of chips at 375 px; 1.000 characters of Vietnamese with stacked diacritics never clip in the textarea.

## Design notes

- Web (≥ 1024): centred column max-width 720, one block per line separated by hairlines, stars 32 px, chips as small pills, photo row of 5 square 80 px tiles, the anonymous switch and "Gửi đánh giá" black pill in a footer row at the end.
- App (< 1024): full screen, header back + "Đánh giá sản phẩm", tab bar hidden; stars 40 px for thumbs; "Gửi đánh giá" pinned at the bottom above the safe area; photo grid 5 tiles in one row scrolling.
- Stars in ink (filled) and hairline (empty), not gold; serif only for the page title.

## FE notes

- Route `/orders/:id/review`; `ReviewForm` with `ReviewLineBlock`, `StarInput` (radio group, keyboard arrows, `aria-label="4 sao"`), `TagChips`, `PhotoPicker` (shared with US-RET-001), `AnonymousSwitch`.
- Pure functions to TDD:
  - `canReview(order, now)` → `{ ok, until }`: true from `delivered`; for `completed` until `completedAt` + the days in rules.md#reviews; `return_requested` and `returned` keep the window of the status before them (reviews are never blocked by a return, rules.md#reviews); false for every other status.
  - `reviewableLines(order, reviews)`, `canEditReview(review)` (`!edited && !shopReply`).
  - `tagsFor(stars)`, `pruneTags(tags, stars)`, `maskName(name)` → "L***à" (first and last letter kept, NFC-safe).
- Store action `reviews.submit(orderId, drafts)` updates product `rating` and `ratingCount`; the PDP summary recalculates from the store.
- Enhanced by REV P1: My reviews page; Review edit history.

## Mock data

- A delivered 3-line order with none reviewed; a completed order with 1 of 2 lines reviewed (editable) and 1 with a seeded shop reply; a completed order 29 days after completion (last day); one with an open return.
- 3 sample photos in `src/mock/data/` (shared with RET).

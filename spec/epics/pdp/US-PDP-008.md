---
id: US-PDP-008
title: Reviews summary and full reviews page with filters
epic: PDP
priority: P0
status: Draft
size: M
routes: ["/p/:slug", "/p/:slug/reviews"]
dependsOn: [US-PDP-001]
---

## Story

As a buyer, I want to see how others rated this product, read the newest reviews including the bad ones, and filter by stars, photos, or my Phân loại, so that I can judge quality honestly.

## Acceptance criteria

- Given the product page, then the reviews summary shows the average ("4,7 trên 5"), the star row, the count ("(222)"), a distribution bar per star 5 to 1 with counts, and the 3 newest reviews; "Xem tất cả đánh giá" goes to `/p/:slug/reviews`.
- Given `/p/:slug/reviews`, then reviews list newest first ("Mới nhất" is the only sort in P0) and no review is ever hidden or reordered by rating (rules.md#reviews).
- Given the filter chips "Tất cả", "5 Sao" … "1 Sao" (each with its count, e.g. "1 Sao (4)"), "Có hình ảnh", "Có bình luận", and "Phân loại" (opens a list of the product's SKUs that have reviews), when I pick filters, then the list updates and the query holds them (`star`, `media=1`, `comment=1`, `sku`); star is single-select, the others combine.
- Given a review, then it shows the buyer name (masked "h***a" when anonymous), stars, date, "Phân loại: {options}", tags, text, photos as 64px thumbnails opening the image viewer (US-PDP-001), and, when present, "Phản hồi của Shop" with the reply text.
- Given more than 10 reviews match, then "Xem thêm đánh giá" loads the next 10 and updates `page` with `replace`.
- Given a filter combination matches nothing, then "Chưa có đánh giá phù hợp" shows with "Xem tất cả" to clear filters.
- Given the review is mine (`isMine`), then it shows the label "Đánh giá của bạn" and stays in its date position (no pinning).

## UI states

- Empty: product with 0 reviews → the summary reads "Chưa có đánh giá nào cho sản phẩm này" and the reviews link is hidden; the page route still works with the same message.
- Loading: summary skeleton; list shows 3 review skeletons; "Xem thêm đánh giá" shows a spinner in the button.
- Error: list fails → "Không tải được đánh giá. Thử lại." with "Thử lại".
- Unavailable: a review of a SKU no longer sold still shows its "Phân loại" text from the review snapshot.
- Overflow: a 1.000-character review clamps to 6 lines with "Xem thêm"; 5 photos fit one row on web and scroll on app; counts above 999 use the compact count ("1,2k").

## Design notes

- Web (≥ 1024): on PDP the summary is a two-column section: big average in the serif 40px with stars and count on the left, distribution bars (ink on paper tint, no colours by star) on the right, then 3 reviews. The reviews page uses the same header, then the chip row and a single-column list max-width 760.
- App (< 1024): summary row "4,7 ★ Đánh giá sản phẩm (222) ›" plus 2 newest reviews; the reviews page has a back/title header "Đánh giá", the chip row scrolling horizontally, and the "Phân loại" filter as a bottom sheet.
- Stars in ink, not yellow; 1-star reviews look the same as 5-star ones.

## FE notes

- Route `/p/:slug/reviews` with query `star`, `media`, `comment`, `sku`, `page`; `parseReviewParams` drops invalid values.
- Pure, TDD: `reviewSummary(reviews)` → `{ avg (1 decimal, rounded half up), count, byStar[5] }`; `filterReviews(reviews, params)` (sorted by `createdAt` desc, stable by id; asserts the output is a subset with no rating-based reordering); `maskName(name)`.
- `ReviewList` and `ReviewItem` are reused by US-SHP-004 (shop-level reviews).

## Mock data

- A product with 222 reviews: mixed ratings including 4 one-star reviews, ~20% with photos, some without text, 3 with shop replies, 1 anonymous, 1 by the persona.
- A product with 0 reviews and a review whose SKU was later removed.

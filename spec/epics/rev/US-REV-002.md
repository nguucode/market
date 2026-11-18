---
id: US-REV-002
title: Review prompts and review status on orders
epic: REV
priority: P0
status: Draft
size: S
routes: ["/orders", "/orders/:id"]
dependsOn: [US-REV-001, US-ORD-001]
---

## Story

As a buyer, I want my orders to tell me which items still wait for my review and until when, so that I review while I still remember and do not find out too late that the window closed.

## Acceptance criteria

- Given a `delivered` or `completed` order with unreviewed lines and `canReview` true, then its card in "Đã giao" and "Tất cả" shows "Đánh giá" as the primary action (US-ORD-001 picks it after "Đã nhận được hàng" for `delivered`), and tapping it opens `/orders/:id/review`.
- Given the same order's detail, then a review banner shows "Đánh giá sản phẩm trước 18/12/2026" with the pill "Đánh giá"; within the last 3 days it reads "Còn 2 ngày để đánh giá" and on the last day "Hôm nay là ngày cuối để đánh giá".
- Given some lines are reviewed, then the banner reads "Đã đánh giá 1/2 sản phẩm" with "Đánh giá tiếp"; given all are reviewed, then the card action becomes "Mua lại" and the detail shows "Xem đánh giá" (opens `/orders/:id/review` read-only, US-REV-001).
- Given each line on the detail, then a reviewed line shows its stars and "Đã đánh giá"; an unreviewed line in the window shows nothing extra (the banner speaks for the order).
- Given the window has passed (Demo control clock jump) with lines unreviewed, then no "Đánh giá" action exists, and the detail shows the muted line "Đã hết hạn đánh giá (18/12/2026)."; reviewed lines still show their reviews.
- Given an order with an open return request, then the review banner still shows while the window is open (rules.md#reviews).

## UI states

- Empty: no reviewable orders → nothing extra on the list.
- Loading: the banner renders with the detail; no separate skeleton.
- Error: none beyond the detail's error state (US-ORD-002).
- Unavailable: window closed as above; `awaiting_payment` through `shipping` and `cancelled` never show the banner.
- Overflow: "Hôm nay là ngày cuối để đánh giá" plus the pill fits one line at 375 px or wraps the pill below; "Đã đánh giá 4/5 sản phẩm" with "Đánh giá tiếp" fits one line at 375 px.

## Design notes

- Web (≥ 1024): banner as a full-width strip at the top of the left column under the status block, an editorial light tint with ink text, outlined pill "Đánh giá" on the right.
- App (< 1024): the same strip under the status band; "Đánh giá" also leads the sticky bottom bar when it is the primary action.
- Urgency only through the copy and the deal colour on the last 3 days, never red or a flashing badge.

## FE notes

- Pure functions to TDD: `reviewPrompt(order, reviews, now)` → `{ kind: 'none' | 'open' | 'partial' | 'done' | 'expired', until, daysLeft, reviewed, total }` built on `canReview` and `reviewableLines` from US-REV-001; `orderActions` (US-ORD-001) reads it for the card's primary action.
- `OrderReviewBanner` on `/orders/:id`; line badge in `OrderLines`.
- Enhanced by REV P1: My reviews page.

## Mock data

- Completed orders with the window: 20 days left, 2 days left, last day, expired with lines unreviewed, all reviewed; a delivered order with 1 of 2 lines reviewed; an order with an open return.

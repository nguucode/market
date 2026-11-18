---
id: US-SHP-004
title: Shop reviews and About with seller information
epic: SHP
priority: P0
status: Draft
size: S
routes: ["/s/:handle"]
dependsOn: [US-SHP-001, US-PDP-008, US-PDP-006]
---

## Story

As a buyer, I want to read every review of the shop's products and see who legally runs the shop, so that I can trust it before buying.

## Acceptance criteria

- Given the `reviews` tab, then the header shows the shop's average over all its products' reviews ("4,9 trên 5"), the count, and the distribution per star; the list shows reviews of all the shop's products, newest first, with the product name and "Phân loại" on each and a link to `/p/:slug` (rules.md#reviews).
- Given the `reviews` tab, then the filter chips "Tất cả", "5 Sao" … "1 Sao" with counts and "Có hình ảnh" filter the list and live in the query (`star`, `media=1`, `page`); no review is hidden or reordered by rating.
- Given the `about` tab, then it shows "Giới thiệu" (the shop description), and the facts: location, "Tham gia {dd/mm/yyyy}", "{n} sản phẩm", "Tỉ lệ phản hồi {n}%", "Phản hồi {responseTime}".
- Given the `about` tab, then the "Thông tin người bán" section is expanded by default and shows "Tên doanh nghiệp" (`legalName`), "Địa chỉ kinh doanh" (`businessAddress`), "Mã số doanh nghiệp" (`businessCode`), and the badge "Đã xác thực" (rules.md#seller-and-product-disclosures).
- Given the shop does not accept Thanh toán khi nhận hàng, then the `about` tab says "Shop không hỗ trợ Thanh toán khi nhận hàng" among the facts (rules.md#payment).
- Given a shop with no reviews, then the `reviews` tab shows "Shop chưa có đánh giá nào".

## UI states

- Empty: no reviews as above; no description → "Giới thiệu" section hidden, facts and seller information still shown.
- Loading: reviews list skeletons; About renders from the shop record at once.
- Error: reviews fail → "Không tải được đánh giá. Thử lại." with "Thử lại".
- Unavailable: reviews of delisted products still show, with the product name as plain text instead of a link.
- Overflow: a 1.000-character description clamps to 8 lines with "Xem thêm"; a long `businessAddress` wraps; 8.000 reviews page 10 at a time with "Xem thêm đánh giá".

## Design notes

- Web (≥ 1024): `reviews` tab reuses the PDP reviews layout (single column, max-width 760) with a product thumbnail and name above each review. `about` tab is two columns: description on the left (serif heading, comfortable 16px body), facts and "Thông tin người bán" in a right column card on the paper tint.
- App (< 1024): `reviews` tab as on `/p/:slug/reviews`, chips scrolling horizontally; `about` tab stacks description, facts list, then "Thông tin người bán".
- "Đã xác thực" badge: small ink pill with a check, the same as the official badge style but different label.

## FE notes

- Reuses `ReviewList`, `ReviewItem`, `reviewSummary`, and `filterReviews` from US-PDP-008 with `scope: { shopId }`, and `SellerInfo` from US-PDP-006 with `defaultOpen`.
- Pure, TDD: `shopReviews(reviews, products, shopId)` joining product name and status.
- Query on `/s/:handle`: `tab=reviews|about`, `star`, `media`, `page`.

## Mock data

- An official shop with ~600 reviews across its products, one shop with 0 reviews, a COD-off shop, and a shop with a 1.000-character description.
- Every shop's fictional `legalName` (e.g. "Công ty TNHH Gia Dụng Minh An"), `businessAddress`, and 10-digit `businessCode`.

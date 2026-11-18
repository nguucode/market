---
id: US-DSC-002
title: Category page
epic: DSC
priority: P0
status: Draft
size: M
routes: ["/c/:slug"]
dependsOn: [US-DSC-001, US-FND-007, US-DSC-005, US-DSC-004, US-FND-006]
---

## Story

As a buyer browsing a category, I want to see its subcategories, what sells best in it, and a filterable grid, so that I can narrow down without starting a search.

## Acceptance criteria

- Given I open `/c/:slug` for a level-1 or level-2 category, then I see a breadcrumb ("Trang chủ" › level-1 › level-2), the category name as the page title, a row of subcategory tiles (its direct children), a "Bán chạy" rail of the 10 products with the highest `soldCount` in the subtree, and then the results grid of the whole subtree with the filter chips row and sort.
- Given I open `/c/:slug` for a level-3 category, then there are no tiles and no rail: the page is the results grid with the same filters and sort as `/search`, scoped to that category.
- Given any category page, when I change a filter or the sort, then the query string updates (same keys as `/search` except `q` and `cat`, which the route fixes) and the grid re-renders; Back restores the previous filters.
- Given a level-1 or level-2 page, when I open "Bộ lọc", then the "Danh mục" facet lists only categories inside this subtree; on a level-3 page the "Danh mục" facet is hidden.
- Given I tap a subcategory tile, then I go to `/c/:slug` of that child with the current filters dropped (a new scope starts clean).
- Given a slug that does not exist, then the not-found page renders (US-FND-006).

## UI states

- Empty: the subtree has products but none match the filters → the no-results block from US-DSC-006 with "Xóa bộ lọc"; a category with no products at all shows "Danh mục này chưa có sản phẩm." and the "Gợi ý hôm nay" grid.
- Loading: title and tiles render at once; rail and grid show card skeletons (US-FND-009) for the mock latency.
- Error: grid fails → "Không tải được sản phẩm. Thử lại." inside the grid area; tiles and breadcrumb stay.
- Unavailable: delisted products never appear; out-of-stock products appear with the card's "Hết hàng" label (US-FND-007).
- Overflow: "Thể thao & Dã ngoại" title wraps on two lines at 375px; the breadcrumb collapses middle levels to "…" on app; a level-2 with 14 children shows tiles in a horizontal scroll row (app) or wraps to two rows (web).

## Design notes

- Web (≥ 1024): serif title 32px, breadcrumb above it 13px muted. Tiles are round 96px images with label below, max 8 per row. "Bán chạy" rail is a horizontal scroller of product cards with a "Xem tất cả" outline pill that sets `sort=bestselling` on this page. Grid 5 columns at 1440, 4 at 1024.
- App (< 1024): back/title header with the category name; tiles 64px in a horizontal scroll row; rail as horizontal cards with peek; 2-column grid. The chip row sticks under the header when scrolling.
- No banner image on category pages; the tiles are the imagery.

## FE notes

- Route `/c/:slug`; reads `price_min, price_max, rating, location, official, freeship, sale, voucher, cod, sort, page` via the same `parseSearchParams` as `/search` (US-DSC-005) and injects `cat = slug`.
- `subtreeIds(categories, id)` pure, TDD (3 levels, leaf returns itself).
- Results grid, sort, and paging are the `SearchResults` component from US-DSC-004 with `scope={ categoryId }`; filters from US-DSC-005 with `hideFacets={['category']}` on level 3.
- `topSelling(products, ids, n)` pure, TDD (ties by rating then id for a stable order).

## Mock data

- The level-1 "Đồ bếp" with ~120 products for a full page; one level-3 with exactly 3 products (short grid); one level-3 with 0 products (empty state).
- At least one out-of-stock product inside "Đồ bếp" to show the card label.

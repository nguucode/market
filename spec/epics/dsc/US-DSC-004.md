---
id: US-DSC-004
title: Search results grid with sort and paging
epic: DSC
priority: P0
status: Draft
size: M
routes: ["/search"]
dependsOn: [US-DSC-003, US-FND-007, US-FND-009, US-DSC-005, US-PDP-002]
---

## Story

As a buyer who searched, I want a clean grid of matching products that I can reorder by relevance, newness, sales, or price and page through, so that I can compare options quickly.

## Acceptance criteria

- Given I open `/search?q=bình giữ nhiệt`, then I see the heading "Kết quả tìm kiếm cho “bình giữ nhiệt”", the result count ("1.248 sản phẩm"), the filter chips row (US-DSC-005), the sort control, and a grid of product cards (US-FND-007), 40 per page.
- Given the sort control, then the options are "Liên quan" (default when `q` is set), "Mới nhất", "Bán chạy", "Giá: Thấp đến Cao", "Giá: Cao đến Thấp"; choosing one sets `sort=relevance|newest|bestselling|price_asc|price_desc`, resets `page`, and keeps every filter.
- Given sort by price, then a product with a price range sorts by its lowest current price (flash-sale price when a slot is active, rules.md#price-display).
- Given the web layout and more than 40 results, then numbered pagination sits under the grid ("‹ 1 2 3 … 32 ›"); choosing a page sets `page=n` and scrolls to the top of the grid.
- Given the app layout, when I scroll near the end of the grid, then the next page appends, `page` in the URL is replaced (not pushed), and after the last page the line "Bạn đã xem hết kết quả" ends the list.
- Given I open a results URL directly or press Back from a product page, then the same query, filters, sort, and page render, and on Back the scroll position is restored.
- Given `q` matches no product, then the no-results state from US-DSC-006 renders instead of the grid.

## UI states

- Empty: zero matches → US-DSC-006.
- Loading: chip row and heading render at once; the grid shows 20 card skeletons for the mock latency (US-FND-003); app "load more" shows 4 skeletons under the list.
- Error: query fails → "Không tải được kết quả. Thử lại." with "Thử lại" in place of the grid (US-FND-009); chip row stays usable.
- Unavailable: delisted products never appear; out-of-stock products stay in results with the card's "Hết hàng" label and sort last within "Liên quan" only.
- Overflow: a 100-character query in the heading wraps to two lines, then ellipsis; count above 9.999 uses the dot separator ("12.480 sản phẩm"); `page` beyond the last page clamps to the last page with `replace`.

## Design notes

- Web (≥ 1024): heading in the serif 24px, count 14px muted on the same line; the sort control right-aligned on the chip row as a text button "Sắp xếp: Liên quan ▾" opening a small menu (the reference study's "most relevant ▾" grammar), not a row of tabs. Grid 5 columns at 1440, 4 at 1024, 24px gutters.
- App (< 1024): header with the search field showing `q` (tap reopens input state); chip row sticky under it with the sort as the first chip "Liên quan ▾" opening a bottom sheet of radio options (US-FND-008); 2-column grid, 12px gutters.
- Pagination: plain numerals, current page in an ink pill.

## FE notes

- Pure, TDD: `searchProducts(products, params, now)` → `{ items, total }` combining `matchScore(product, query)` (name tokens > category names > shop name; normalised with `normalizeVi` from US-DSC-003), filters from `applyFilters` (US-DSC-005), and `sortProducts(items, sort, now)`; `paginate(items, page, size = 40)` with clamping.
- Effective price for sort and price filters comes from `priceView` in US-PDP-002 (lowest SKU price, flash price inside a slot).
- `SearchResults` component takes `scope` so US-DSC-002 reuses it.
- Scroll restoration keyed by full URL in `sessionStorage` (try/catch).

## Mock data

- "bình giữ nhiệt" returns ~60 products across 3 level-3 categories and 12 shops (2 pages on web).
- Ties in "Bán chạy" broken by id so paging never duplicates or skips a product.
- One out-of-stock match and one match with a flash-sale price in the current slot.

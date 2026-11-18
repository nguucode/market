---
id: US-SHP-002
title: Shop products with shop categories, search, and sort
epic: SHP
priority: P0
status: Draft
size: M
routes: ["/s/:handle"]
dependsOn: [US-SHP-001, US-FND-007]
---

## Story

As a buyer on a shop page, I want to browse the shop's own categories, search inside the shop, and sort its products, so that I can find a specific item from a shop I trust.

## Acceptance criteria

- Given the `shop` tab, then a "Bán chạy" rail shows the shop's 10 best-selling active products, followed by "Tất cả sản phẩm" (the first 20 by "Phổ biến") and "Xem tất cả" to `?tab=products`.
- Given the `products` tab, then I see a search field "Tìm trong Shop", the sort control ("Phổ biến" default, "Mới nhất", "Bán chạy", "Giá: Thấp đến Cao", "Giá: Cao đến Thấp"), and the grid of the shop's active products, 40 per page.
- Given the `categories` tab, then it lists the shop's categories ("Tất cả sản phẩm" first) each with its product count; picking one goes to `?tab=products&cat={id}` and the products tab shows a removable chip with the category name.
- Given the web layout and the `products` tab, then the shop categories also show as a left column with counts (the reference study's shop grammar), and the selected one is marked.
- Given I submit a search in "Tìm trong Shop", then `?tab=products&q=` updates, the grid shows matches within this shop only (case and diacritics ignored), and "Liên quan" is added to the sort options and selected.
- Given any change of `cat`, `q`, `sort`, or `page`, then it lives in the query (push for `cat` and `q`, replace for `page`), and Back restores the previous state.
- Given a search or category with no product, then "Không tìm thấy sản phẩm nào trong Shop" shows with "Xem tất cả sản phẩm" clearing `q` and `cat`.

## UI states

- Empty: a shop with 0 active products → "Shop chưa có sản phẩm nào" on `shop` and `products` tabs; the categories tab lists categories with "(0)".
- Loading: grid skeletons (US-FND-009) for the mock latency.
- Error: "Không tải được sản phẩm. Thử lại." with "Thử lại" in place of the grid.
- Unavailable: delisted products never show; sold-out products show with "Hết hàng" and sort last in "Phổ biến".
- Overflow: a shop category name of 30 characters wraps in the web column; a shop with 400 products pages on web and infinite-scrolls on app (as US-DSC-004); a shop with 15 categories scrolls inside the web left column.

## Design notes

- Web (≥ 1024): `products` tab is two columns: shop categories 240px left (plain text links with counts, selected in bold with an ink bar) and the grid (4 columns at 1440, 3 at 1024) with the shop search pill and the sort text button above it.
- App (< 1024): `products` tab has the shop search pill and the sort chip in a sticky row; 2-column grid; categories live only in the `categories` tab as a list with counts and chevrons.
- Same card (US-FND-007) as everywhere; no shop-specific decoration in P0.

## FE notes

- Query on `/s/:handle`: `tab`, `cat` (shop category id), `q`, `sort` (`popular|relevance|newest|bestselling|price_asc|price_desc`), `page`.
- Reuse `normalizeVi`, `sortProducts`, and `paginate` from US-DSC-003/US-DSC-004 when they exist; "Phổ biến" is a new sort key = `soldCount × rating` with id tie-break, added to `sortProducts`.
- Pure, TDD: `shopCategoryCounts(products, shop)`, `shopProducts(products, shopId, params, now)`.

## Mock data

- One shop with 120 products in 6 shop categories, one with 400 products and 15 categories, one with 0 active products.
- Shop categories are the shop's own grouping (e.g. "Bình giữ nhiệt", "Ly sứ", "Phụ kiện"), not the platform tree.

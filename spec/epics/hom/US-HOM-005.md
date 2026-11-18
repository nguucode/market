---
id: US-HOM-005
title: Themed rails and the recommendations grid
epic: HOM
priority: P0
status: Draft
size: M
routes: ["/"]
dependsOn: [US-HOM-001, US-FND-007]
---

## Story

As a buyer with no particular item in mind, I want a few curated themes and then an open grid of suggestions, so that I keep finding things worth a look the longer I scroll.

## Acceptance criteria

- Given Home, then 2 to 3 themed rails follow the voucher strip, each with a heading from mock data (for example "Đồ bếp dưới 200K", "Quà tặng cho mẹ", "Mới từ Shop chính hãng") and a "Xem tất cả" pill linking to the rail's search query (for example `/search?cat=do-bep&price_max=200000`).
- Given a rail, then it shows up to 12 product cards (US-FND-007) matching its query, active only, in seeded order; a rail with fewer than 4 matches is omitted.
- Given the recommendations section, then it is headed "Gợi ý hôm nay" and shows a product grid that loads 20 more cards automatically as I near its end, for the first 3 pages (60 cards), then shows a "Xem thêm" pill that loads the next 20 per press, so the footer stays reachable.
- Given recommendations, then they exclude delisted products, products already shown in the flash-sale band, and duplicates across pages.
- Given a page of recommendations fails to load, then the grid keeps what it has and shows "Không tải được thêm sản phẩm." with "Thử lại" in place of the loader.
- Given I have scrolled through all products, then the grid ends with "Bạn đã xem hết gợi ý hôm nay." and no loader.

## UI states

- Empty: a rail with fewer than 4 matches is omitted; recommendations always have data in the seed.
- Loading: rail card skeletons; the grid appends 20 skeleton cards while a page loads (`aria-busy` on the grid).
- Error: per-page inline error as above; a rail error shows the section inline error.
- Unavailable: products that go out of stock show "Hết hàng" on their card and stay; delisted ones disappear on the next page load only (no reflow of loaded cards).
- Overflow: rail titles up to 40 characters on one line at 375px ("Đồ bếp dưới 200K" uses the compact money form allowed in titles, rules.md#spec-conventions); 120-character names truncate on the card; at 1440px the grid is 5 columns and partial last rows are left aligned.

## Design notes

- Web (≥ 1024): rails as horizontal rows of 5 visible cards with round prev/next buttons; grid 5 columns at 1440, 4 at 1024-1279; section heading sans 24px; "Gợi ý hôm nay" heading in serif 28px to mark the shift from curated to open browsing.
- App (< 1024): rails scroll horizontally with 2½ cards visible; grid 2 columns; "Xem thêm" full-width outlined pill.
- No "Sponsored"/"Ad" labels in P0; no infinite spinner without an end.

## FE notes

- `ThemedRails.tsx` reads `store.catalog.getHomeRails()` → `[{ title, query }]` and runs each through `queryProducts` (US-FND-003).
- `Recommendations.tsx` uses `IntersectionObserver` on a sentinel; `recommendationPage(catalog, excludeIds, page, size)` pure and TDD (seeded order, excludes, no duplicates across pages, returns `hasMore`).
- `autoLoadAllowed(pagesLoaded)` → `pagesLoaded < 3` (TDD with the boundary).
- Loaded pages persist in `sessionStorage` so back from PDP restores them (US-HOM-001).

## Mock data

- 3 rail definitions in `editorial.json` whose queries return 12, 8 and 3 products (the last one must be omitted, exercising the rule); the ~1.200-product catalogue for recommendations.

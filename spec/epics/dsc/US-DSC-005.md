---
id: US-DSC-005
title: Filter chips and the filter panel
epic: DSC
priority: P0
status: Draft
size: M
routes: ["/search", "/c/:slug"]
dependsOn: [US-FND-008]
---

## Story

As a buyer looking at many results, I want a few quick filter chips and one panel for the rest, all kept in the URL, so that I can narrow by price, deal, place, and trust without a heavy sidebar.

## Acceptance criteria

- Given a results page, then the chip row shows, in order: "Bộ lọc" (with the active filter count, e.g. "Bộ lọc (3)"), then quick toggle chips "Đang giảm", "Freeship", "Shop chính hãng", "4★ trở lên", "Hỗ trợ COD", then one removable chip per other active filter ("Đà Nẵng ✕", "100K – 300K ✕") and "Xóa tất cả" when any filter is active.
- Given I tap "Bộ lọc", then the panel opens with sections, in order: "Khoảng giá" (inputs "Tối thiểu" and "Tối đa" plus presets "Dưới 100K", "100K – 300K", "300K – 500K", "Trên 500K"), "Ưu đãi" ("Đang giảm", "Freeship", "Có voucher"), "Danh mục" (level-3 categories in the current results with counts), "Nơi bán" (provinces of shops in the current results, plus "Nước ngoài" for cross-border shops), "Đánh giá" ("4★ trở lên"), "Loại shop" ("Shop chính hãng"), "Dịch vụ" ("Hỗ trợ COD").
- Given I change options in the panel, then nothing applies until I tap "Áp dụng"; the button shows the live result count ("Áp dụng (124)"); "Thiết lập lại" clears the panel's draft; closing without applying discards the draft.
- Given filters are applied, then they are written to the query: `price_min`, `price_max`, `sale=1`, `freeship=1`, `voucher=1`, `cat`, `location` (comma-separated province codes), `rating=4`, `official=1`, `cod=1`; `page` resets; reloading or sharing the URL restores the same chips and results.
- Given I enter "Tối thiểu" greater than "Tối đa", when I tap "Áp dụng", then the panel stays open with "Vui lòng điền khoảng giá phù hợp" under the inputs and nothing applies; non-digits are stripped as I type and the inputs display with dot separators.
- Given a facet option whose count is 0 under the other active filters, then it shows "(0)" and is disabled, unless it is currently selected (then it stays enabled so I can clear it).
- Given the meaning of each filter: "Đang giảm" = any SKU has `priceBeforePromo` or an active flash-sale price; "Freeship" = `freeShipEligible`; "Có voucher" = the shop has a shop voucher that is live and has quota; "Hỗ trợ COD" = `shop.codEnabled`; "4★ trở lên" = product rating ≥ 4; price compares the lowest current price (rules.md#price-display).

## UI states

- Empty: filters lead to zero results → US-DSC-006 with "Xóa bộ lọc"; the chip row stays so I can remove one chip instead.
- Loading: counts in the panel compute locally; no spinner. Applying shows grid skeletons (US-DSC-004).
- Error: an invalid query value (`rating=9`, `price_min=abc`, unknown province) is dropped silently and the URL is rewritten with `replace`.
- Unavailable: on a level-3 category page the "Danh mục" section is hidden (US-DSC-002).
- Overflow: "Nơi bán" with more than 6 provinces shows 6 then "Xem thêm"; the chip row scrolls horizontally on app with a fade at the edge; a price chip "1,2Tr – 12,5Tr ✕" uses the compact form (rules.md#spec-conventions).

## Design notes

- Web (≥ 1024): chip row under the results heading; chips are pills (36px, light grey fill, ink text; selected = ink fill, paper text). "Bộ lọc" opens a right side panel 400px (US-FND-008) with section headings in the serif 16px, checkboxes and radio pills, sticky footer with "Thiết lập lại" (text button) and "Áp dụng" (black pill).
- App (< 1024): chip row sticky under the header, horizontally scrollable, the sort chip first (US-DSC-004) then "Bộ lọc". The panel is a full-height bottom sheet with the same sections and a sticky footer.
- No colour for filters except ink; the deal colour is reserved for prices.

## FE notes

- Pure, TDD: `parseSearchParams(query)` and `serializeSearchParams(params)` (round trip, key order stable, defaults omitted, invalid values dropped), `applyFilters(products, shops, params, now)`, `facetCounts(products, shops, params, now)` (each facet counted with all other facets applied), `parseVndInput("1.200.000")`.
- `useSearchParamsState()` hook is the only writer of the query; panel draft lives in component state until "Áp dụng".
- `voucher` and `cod` are not yet in sitemap.yaml `search.query`; this story needs them added there.
- Province list from the address dataset (rules.md#address), cross-border shops map to the pseudo-code `foreign`.

## Mock data

- Results for "bình giữ nhiệt" spread over Hà Nội, TP.HCM, Đà Nẵng, and one cross-border shop; 1 official shop; 1 shop with COD off; prices from 89.000₫ to 1.249.900₫.
- One shop whose only voucher is expired and one whose voucher quota is used up, to prove "Có voucher" excludes both.

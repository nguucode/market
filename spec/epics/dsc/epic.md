---
code: DSC
name: Discovery
route: /search
summary: Category browser and category pages, the search input with history and suggestions, the results grid with sort and paging, filter chips and the filter panel, and the no-results and shop-match states.
---

# DSC · Discovery

Everything between "I want something" and a product page. The buyer either walks the three-level category tree or types a query; both land on the same results grammar: a chip row with the active filters, one "Bộ lọc" panel for the rest, a sort control, and a borderless 4:5 grid of product cards. Every filter and the sort live in the query string, so a results page can be shared, reloaded, and opened on /device unchanged. The reference study's chip row replaces the heavy filter sidebar VN marketplaces use; the VN facets (Nơi bán, Hỗ trợ COD, Shop chính hãng, Ưu đãi) stay.

## P0 stories

- US-DSC-001 — Category browser
- US-DSC-002 — Category page
- US-DSC-003 — Search input with history and suggestions
- US-DSC-004 — Search results grid with sort and paging
- US-DSC-005 — Filter chips and the filter panel
- US-DSC-006 — No results and shop match in search

## P1 backlog

| Title | Why P1 |
|---|---|
| Search by image | Needs an image-match mock that adds nothing to the demo loop. |
| Delivery-date and Hỏa tốc facet ("Nhận hàng trước …") | Needs a per-result shipping quote against the buyer's address; the PDP estimate covers the loop. |
| Brand (Thương hiệu) and colour facets | Facets depend on per-category attribute schemas the mock does not model yet. |
| Spelling correction ("Có phải bạn muốn tìm …") | The no-results state already offers a way out; correction needs a dictionary. |
| Sponsored results label and placement | Market has no ads model; adding one only to label it is scope for a later case-study pass. |
| Recently viewed products in the search input | Needs view tracking across PDP visits; history covers the input state in P0. |
| Remove one search-history entry | "Xóa lịch sử tìm kiếm" clears all in P0; single delete is polish. |

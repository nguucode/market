---
id: US-DSC-006
title: No results and shop match in search
epic: DSC
priority: P0
status: Draft
size: S
routes: ["/search"]
dependsOn: [US-DSC-004]
---

## Story

As a buyer, I want a useful page when my search finds nothing, and the shop itself at the top when I type a shop's name, so that I never hit a dead end and can go straight to a shop I know.

## Acceptance criteria

- Given `q` matches no product and no filter is active, then I see "Không tìm thấy kết quả nào cho “{q}”", the hint "Hãy thử từ khóa khác hoặc từ khóa chung hơn", the "Tìm kiếm phổ biến" pills (US-DSC-003), and a "Gợi ý hôm nay" grid of 20 products.
- Given `q` matches products but the active filters leave none, then the message is "Không có sản phẩm phù hợp với bộ lọc" with a black pill "Xóa bộ lọc" that removes every filter and keeps `q` and `sort`.
- Given `q` matches a shop name or handle (case and diacritics ignored, whole words), then a shop card sits above the results: avatar, name, "Shop chính hãng" badge when official, rating, "{n} người theo dõi", "{n} sản phẩm", and an outline pill "Xem shop" to `/s/:handle`.
- Given several shops match, then only the best one shows (exact name match first, then most followers); given the query also matches products, the shop card shows above the grid, not instead of it.
- Given a shop matches and no product does, then the shop card shows and the no-results block follows it.
- Given a filter is active, then the shop card is hidden (filters describe products, not shops).

## UI states

- Empty: this story is the empty state for US-DSC-004.
- Loading: shop match resolves with the results; no separate skeleton.
- Error: as US-DSC-004.
- Unavailable: a shop match is never hidden for having no products; it shows "0 sản phẩm".
- Overflow: a 40-character shop name truncates with ellipsis on one line; the badge and rating move to a second line on app rather than shrinking the name further; "Không tìm thấy kết quả nào cho “…”" wraps the quoted query, max two lines then ellipsis.

## Design notes

- Web (≥ 1024): the shop card is a full-width row (not a product-card cell): 64px round avatar, name in the serif 20px, trust line 14px muted, "Xem shop" pill right-aligned. No border; a hairline divider separates it from the grid. The no-results block is centred, max-width 560, serif headline.
- App (< 1024): the shop card is a compact row with 48px avatar and the pill on the right; no-results stacks message, pills, then the 2-column "Gợi ý hôm nay" grid.

## FE notes

- Pure, TDD: `matchShop(shops, query)` → best shop or null (word-boundary match on `normalizeVi` output, tie-break as above).
- `NoResults` takes `{ query, hasFilters }` and picks the copy; "Xóa bộ lọc" calls `serializeSearchParams({ q, sort })` (US-DSC-005).
- "Gợi ý hôm nay" reuses the Home recommendations selector when available; otherwise top products by `soldCount`.

## Mock data

- Query "zzqx" (no match), "bình giữ nhiệt" with filter `location=foreign&official=1` (filters to zero), and a shop named "Gốm Bát Tràng Minh Long Handmade Đà Nẵng" whose name also contains the product word "gốm".
- Two shops sharing the word "Store" to test the tie-break.

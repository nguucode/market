---
id: US-ACC-004
title: Favourite products
epic: ACC
priority: P0
status: Draft
size: S
routes: ["/favorites"]
dependsOn: [US-ACC-001, US-FND-007, US-PDP-009]
---

## Story

As a buyer, I want one list of the products I marked "Yêu thích", including ones that went out of stock, so that I can come back and buy them later.

## Acceptance criteria

- Given I open `/favorites`, then the title is "Yêu thích" and a grid of product cards (US-FND-007) shows my favourites, most recently added first, with the count "{n} sản phẩm".
- Given a card, then its heart is filled; tapping it removes the product from favourites with the toast "Đã bỏ khỏi Yêu thích" and "Hoàn tác" (US-PDP-009).
- Given a favourite whose SKUs are all out of stock, then the card stays in the list with a "Hết hàng" label over the image and still links to the product page.
- Given a favourite whose product is `delisted`, then the card stays, greyed, with "Sản phẩm không còn bán", does not link, and shows only the heart to remove it.
- Given I favourite a product elsewhere (PDP, cards), then it appears here on the next visit without reload, and the header/tab "Yêu thích" and the Me row count update.
- Given the sitemap marks the Shops tab as P1, then P0 shows only the products list with no tabs.

## UI states

- Empty: "Chưa có sản phẩm yêu thích" with the line "Nhấn ♡ trên sản phẩm để lưu vào đây" and the black pill "Khám phá ngay" to `/`.
- Loading: card skeletons (US-FND-007), 8 on web, 4 on app.
- Error: "Không tải được danh sách Yêu thích." with "Thử lại".
- Unavailable: out of stock and delisted cards as above, never hidden.
- Overflow: 60 favourites page by 24 with "Xem thêm"; the 120-character name clamps to one line on the card (US-FND-007).

## Design notes

- Web (≥ 1024): serif page title, 5-column grid at 1440 and 4 columns at 1024, inside the 1440 container; the account nav from US-ACC-001 is not shown here because "Yêu thích" is a top-level header item.
- App (< 1024): tab "Yêu thích" active; 2-column grid; header "Yêu thích" with the count under it.
- "Hết hàng" label is a small paper pill on the image, ink text; delisted cards at 50% opacity.

## FE notes

- Route `/favorites`, page `FavoritesPage`; selector `selectFavoriteProducts` sorted by `Favorite.createdAt` desc; remove via the US-PDP-009 action.
- Pure function, TDD: `favoriteCardState(product, skus)` → `available | out_of_stock | delisted`.
- Enhanced by ACC P1: Followed shops tab on `/favorites`.

## Mock data

- 12 persona favourites, including one fully out of stock and the delisted product from the cart edge case.

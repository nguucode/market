---
id: US-PDP-009
title: Add to and remove from favourites
epic: PDP
priority: P0
status: Draft
size: S
routes: ["/p/:slug", "/search", "/c/:slug"]
dependsOn: [US-FND-007, US-FND-010]
---

## Story

As a buyer, I want to heart a product from its page or any product card and unheart it the same way, so that I can come back to it later from Yêu thích.

## Acceptance criteria

- Given a product page or a product card (US-FND-007), then a heart button shows with the accessible name "Thêm vào Yêu thích" when off and "Bỏ khỏi Yêu thích" when on, and `aria-pressed` reflects the state.
- Given the heart is off, when I press it, then it fills at once (optimistic), the product is added to Yêu thích, and the toast "Đã thêm vào Yêu thích" shows with "Xem" linking to `/favorites` (US-FND-010).
- Given the heart is on, when I press it, then it empties at once, the product is removed, and the toast "Đã bỏ khỏi Yêu thích" shows with "Hoàn tác", which restores it.
- Given the store rejects the change, then the heart reverts and the toast reads "Không cập nhật được Yêu thích. Thử lại."
- Given the same product appears on several cards on the screen, then all its hearts change together.
- Given a product is delisted or sold out, then the heart still works on its page so I can remove it (it stays in Yêu thích with its label, ACC-004).

## UI states

- Empty: none.
- Loading: no spinner; the optimistic state is the feedback. Rapid double presses are debounced so the final state wins.
- Error: revert as above.
- Unavailable: delisted products show the heart only on their own page (they never appear on cards).
- Overflow: none (fixed-size control).

## Design notes

- Web (≥ 1024): 40px round button on a paper-tint backdrop at the top-right of the main gallery image and of each card image; outline heart in ink, filled heart in ink (not red).
- App (< 1024): in the PDP transparent header (US-PDP-001) and on card images; touch target 44px even if the icon is 20px.
- A short scale animation on fill, none when `prefers-reduced-motion`.

## FE notes

- Store: `favorites.toggle(productId)` returning the new state; selector `useIsFavorite(productId)` so every heart subscribes to one source.
- `FavoriteButton` component used by the product card (US-FND-007) and the gallery (US-PDP-001).
- Pure, TDD: `toggleFavorite(set, productId)` immutable.
- Enhanced by ACC P1: favourite shops and collections.

## Mock data

- Persona starts with 6 favourites, including one delisted and one sold-out product.
- Demo control failure toggle (US-FND-004 latency/error) to show the revert.

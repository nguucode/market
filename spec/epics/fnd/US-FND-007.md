---
id: US-FND-007
title: Product card
epic: FND
priority: P0
status: Draft
size: M
routes: ["/", "/search", "/c/:slug", "/flash-sale"]
dependsOn: [US-FND-002, US-FND-003]
---

## Story

As a buyer scanning a grid, I want each product to show its photo, name, price and one honest signal without noise, so that I can compare many products quickly and trust what the price says.

## Acceptance criteria

- Given a product, then the card shows, top to bottom: the cover image at 4:5 with an 8px radius, the name on one line with "…", the price, and a line "★ 4,8 · Đã bán 1,2k" (rating and sold count via US-FND-002); there is no border, background or shadow around the card.
- Given SKUs share one price, then the card shows that price; given SKU prices differ, then it shows the lowest SKU price (the range is a PDP concern, rules.md#price-display); given the shown price has a `priceBeforePromo`, then the price is in the deal colour and the card's label is `-NN%` (rounded down).
- Given a product could carry several labels, then the card shows at most one (rules.md#price-display), picked in this order: "Hết hàng" (all SKUs at 0), "Flash sale" (an item in the active slot), `-NN%`, "Shop chính hãng", "Freeship"; the label sits as a small pill over the image's top-left corner.
- Given the product is in the active flash-sale slot, then the card shows the slot price in the deal colour, and in the flash variant (Home band, `/flash-sale`) the rating line is replaced by a sold bar with "Đã bán {sold}" and, at 90% of quota or more, "Sắp hết"; at 100% the image dims and the label reads "Đã bán hết".
- Given the heart over the image's top-right corner, then it shows filled when the product is in "Yêu thích" and has `aria-label` "Thêm vào Yêu thích" or "Bỏ khỏi Yêu thích"; pressing it does not open the product (the toggle itself is US-PDP-009).
- Given I click or tap anywhere else on the card, then I go to `/p/:slug`; the card is one link with the heart as a separate button, and keyboard focus shows a 2px ink ring around the image.
- Given a product with no rating yet, then the line reads "Chưa có đánh giá · Đã bán 12"; given sold count 0, then "Đã bán" is omitted.

## UI states

- Empty: not applicable; grids handle empty results (US-FND-009).
- Loading: a skeleton with the same 4:5 block and two text bars, so the grid does not shift when data arrives.
- Error: a broken image shows the paper colour with a neutral product glyph at the same 4:5 size; the rest of the card renders.
- Unavailable: "Hết hàng" label and the image at 60% opacity; the card stays clickable. Delisted products never reach a grid (selectors exclude them) except in "Yêu thích", where ACC-004 labels them.
- Overflow: the 120-character Vietnamese name truncates on one line with diacritics intact (no clipped tone marks: line-height ≥ 1.4); `12.499.000₫` fits a 160px-wide app card at 16px bold; "Đã bán 1,2tr" never wraps under the rating.

## Design notes

- Web (≥ 1024): 4-5 column grid at 1440 (≈ 260px cards), 24px column gap, 32px row gap; name 14px sans in ink, price 16px bold, signal line 12px at 70% ink. Heart: 36px round paper-coloured button with a soft shadow, visible on hover and when filled, always visible on touch.
- App (< 1024): 2 column grid, 12px gap, 16px side margins; same anatomy, price 15px bold; heart always visible.
- Deal colour is the single deal token (a muted green family per the reference study), never red; label pills are white/paper with ink text, the `-NN%` pill uses the deal colour text on paper.

## FE notes

- `src/components/ProductCard.tsx` with props `{ product, flashItem?, variant?: 'grid' | 'flash' | 'rail' }`; the heart's `onToggle` is injected by the screen (US-PDP-009 wires it), the card has no store writes.
- Pure and TDD: `cardPrice(product, skus, activeSlot)` → `{ price, priceBeforePromo?, isFlash }`; `pickCardLabel(product, skus, activeSlot, shop)` → one label or none, following the order above; `soldRatio(item)`.
- Images `loading="lazy"`, `aspect-ratio: 4 / 5`, `object-fit: cover`, `alt` = product name.

## Mock data

- The 120-character name, the `12.499.000₫` product, a product with all SKUs at 0, a flash item at 92% sold and one at 100%, an official-shop product with no discount, a product with no reviews.

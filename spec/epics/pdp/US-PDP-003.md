---
id: US-PDP-003
title: Variant picker with stock per combination
epic: PDP
priority: P0
status: Draft
size: M
routes: ["/p/:slug"]
dependsOn: [US-PDP-001, US-PDP-002]
---

## Story

As a buyer, I want to pick the Phân loại with visible chips that show what is in stock and change the photo, so that I never choose a combination the shop cannot send.

## Acceptance criteria

- Given a product with one or two dimensions, then each dimension renders as a labelled row of chips (e.g. "Màu", "Kích cỡ"), never a dropdown; the label shows the picked value ("Màu: Đen") or "Chọn Màu" when none is picked.
- Given an option of the first dimension carries an image, then its chip shows a 32px thumbnail beside the label, and picking it (or hovering it on web) shows that image in the gallery (US-PDP-001); unpicking returns to the first image.
- Given I have picked an option in one dimension, then every option in the other dimension whose combination with it has `stock: 0` is disabled (struck label, `aria-disabled="true"`, not focusable as a choice); given an option has `stock: 0` in every combination, it is disabled from the start.
- Given I tap the picked chip again, then it unpicks, and the price block returns to the range (US-PDP-002).
- Given a full combination is picked, then the price block shows that SKU's price (US-PDP-002) and the stock line reads "Còn {n} sản phẩm" when stock is 10 or fewer, nothing otherwise.
- Given a product with zero dimensions, then no picker renders and the single SKU is treated as picked.
- Given every SKU has `stock: 0`, then the picker renders all chips disabled and the line "Sản phẩm đã hết hàng" replaces the stock line.

## UI states

- Empty: zero dimensions → no picker.
- Loading: chips render with the product; no own loading.
- Error: none beyond the page.
- Unavailable: disabled chips as above; delisted → picker hidden (US-PDP-001).
- Overflow: 6 options per row wrap to two lines; an option label "Xanh rêu đậm phối trắng" truncates inside a chip max-width 200px with the full label in `title` and the accessible name; a product with 30 SKUs (5 × 6) renders without scrolling inside the row.

## Design notes

- Web (≥ 1024): inline in the right column; chips are 36px rounded rectangles (8px radius) with a 1px hairline border, picked = 2px ink border and bold label, disabled = muted text with a diagonal strike. Option thumbnails sit left inside the chip.
- App (< 1024): the page shows a compact summary row "Phân loại: Đen, 11oz ›" (or "Chọn Phân loại ›"); the full picker lives in the variant sheet opened from it and from the bottom bar (US-PDP-004), with the SKU image, price block, and stock line at the top of the sheet.
- Picked state never uses colour alone; the border weight changes too.

## FE notes

- `VariantPicker` is one component used inline (web) and inside the variant sheet (app); selection state lives in a `useSkuSelection(product)` hook shared by both, so picking in the sheet shows on the page.
- Pure, TDD: `availableOptions(dimensions, skus, selection)` → per option `{ enabled, stock }`; `resolveSku(skus, selection)` → SKU or null when incomplete; `galleryImageFor(dimensions, selection)`.
- Low-stock threshold constant `LOW_STOCK = 10` in one place.
- Chips are a `radiogroup` per dimension with roving tabindex; disabled options are announced "hết hàng".

## Mock data

- The hand-made product with 2 dimensions × 6 options (mock-data.md): some combinations at stock 0, one colour with stock 0 everywhere, one combination with stock 3 (low-stock line), images on colour options.
- One zero-dimension product and one fully sold-out product.

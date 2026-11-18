---
id: US-PDP-001
title: Product page layout and image gallery
epic: PDP
priority: P0
status: Draft
size: M
routes: ["/p/:slug"]
dependsOn: [US-FND-001, US-FND-003, US-FND-009, US-FND-006]
---

## Story

As a buyer, I want the product page to lead with large photos and a clear order of information, so that I can judge the product before reading anything.

## Acceptance criteria

- Given I open `/p/:slug`, then the page shows, in order: breadcrumb (level-1 › level-2 › level-3), gallery, product name, rating line ("4,8 ★ (222) · Đã bán 1,2k"), and the slots for price block, shop vouchers, variant picker, quantity, shipping estimate, actions; below the fold: shop card, details, reviews summary, more from this shop (sitemap.yaml `product.sections`, each filled by its own story).
- Given the gallery, then the first image shows at 4:5; on web thumbnails sit in a vertical strip to the left and hovering or clicking one swaps the main image; on app images swipe horizontally with a counter "1/8".
- Given I click or tap the main image, then the image viewer opens full screen on that image: arrows and swipe move between images, Esc or "Đóng" closes it and returns focus to the image that opened it.
- Given the gallery is told to show an image (by the variant picker, US-PDP-003), then the main image switches to it without adding a history entry, and the thumbnail strip marks it.
- Given a product with `status: delisted`, then the page still renders name and images (greyed) with the notice "Sản phẩm này đã ngừng bán", no price block, no picker, and disabled actions; a "Xem sản phẩm tương tự" link goes to `/c/:slug` of its level-3 category.
- Given a slug that does not exist, then the not-found page renders (US-FND-006).
- Given the page loads, then the document title is "{product name} | Market" and the Back action returns to where I came from with scroll restored.

## UI states

- Empty: a product with one image hides the thumbnail strip and the counter.
- Loading: skeleton of the gallery (4:5 block) and right column lines (US-FND-009) for the mock latency; no layout shift when content arrives.
- Error: product fails to load → "Không tải được sản phẩm. Thử lại." with "Thử lại"; header and nav stay.
- Unavailable: delisted as above; every SKU out of stock → page renders normally with "Hết hàng" from US-PDP-003/004.
- Overflow: the 120-character name wraps to as many lines as needed on PDP (never truncated here) in the serif at 24px web / 20px app; the breadcrumb truncates middle levels with "…" on app; 10 images make the thumbnail strip scroll inside its column.

## Design notes

- Web (≥ 1024): content max-width 1280; two columns, gallery ~60% (thumbnail strip 72px + main image with 8px radius, heart button top-right from US-PDP-009), right column 400–440px, sticky while the gallery scrolls past. The name is serif, weight 400. Below the columns, full-width sections separated by hairlines, section headings serif 20px.
- App (< 1024): the gallery is edge to edge at 4:5 under a transparent header with back, cart (badge), and favourite buttons on soft round backdrops; the header turns solid with the product name once the gallery scrolls away. Sections stack with 8px paper-tint separators. A sticky bottom bar holds the actions (US-PDP-004), so the page bottom padding equals the bar height.
- Warm paper background, one ink colour; no badges over the photo except the deal label owned by US-PDP-002 (at most one).

## FE notes

- Route `/p/:slug`; `useProduct(slug)` from the store returns product, SKUs, shop, category path, and the active flash-sale items for its SKUs.
- `ProductPage` is a layout of section slots; each later story fills one slot, so stories can land in any order after this one.
- `Gallery` exposes `showImage(url)` through context for US-PDP-003; `ImageViewer` is an overlay with focus trap and `aria-modal`.
- Pure, TDD: `categoryPath(categories, categoryId)` → three crumbs.
- Images `loading="lazy"` except the first; `aspect-ratio: 4 / 5` reserved to avoid shift.

## Mock data

- The hand-made 2 × 6 dimension product (mock-data.md) with 8 images, 6 of them tied to colour options.
- One delisted product, the 120-character-name product, and a one-image product.

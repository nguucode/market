---
id: US-HOM-001
title: Home frame and editorial hero
epic: HOM
priority: P0
status: Draft
size: M
routes: ["/"]
dependsOn: [US-FND-001, US-FND-003, US-FND-009]
---

## Story

As a buyer opening Market, I want a calm first screen with one clear idea of what to explore, so that I start browsing instead of bouncing off a wall of banners.

## Acceptance criteria

- Given I open `/`, then the page renders its sections in the order of `sitemap.yaml#screens.home.sections`: hero, category shortcuts, flash sale, voucher strip, themed rails, recommendations; then the footer (US-FND-011).
- Given the hero, then it shows one editorial block from mock data: a serif headline (for example "Góc bếp ấm cho mùa cuối năm"), a one-line subhead ("Nồi, chảo và đồ dùng bếp được chọn từ các shop uy tín."), an image mosaic of 3 product photos, and one black pill CTA ("Khám phá đồ bếp") linking to the block's target (`/c/do-bep`).
- Given I click a mosaic image, then I go to that product's page (`/p/:slug`); the headline and subhead are not links.
- Given the hero's target category or a mosaic product is delisted or missing in the store, then that image is replaced by the next product in the block's fallback list, and the CTA still works; the hero never shows a broken image or a dead link.
- Given each section loads independently, when one section's query fails, then only that section shows the inline error "Không tải được mục này." with "Thử lại" (US-FND-009); the hero and the other sections render normally.
- Given I scroll down, open a product and go back, then Home restores my scroll position and the recommendations pages already loaded.

## UI states

- Empty: a section with no data (no flash slot today and tomorrow, no claimable voucher) is omitted entirely, with no heading left behind; the hero always has data.
- Loading: the hero shows a mosaic skeleton at final size and two text bars; sections below show their own skeletons as they enter the viewport.
- Error: per section, as above; if every section fails, the page shows the full error state from US-FND-009.
- Unavailable: mosaic fallback as above.
- Overflow: a headline of up to 60 characters wraps to at most 3 lines on 375px; the mosaic keeps 4:5 crops at any width; at 1024px the hero text column never narrows below 360px.

## Design notes

- Web (≥ 1024): hero split 5/7 on the paper background: left column serif headline 44px/1.1 in ink, subhead 18px, black pill 48px; right column a 3-image mosaic (one tall 4:5, two stacked) with 8px radius and 12px gaps. A soft editorial colour pair from the reference study (light tint behind the mosaic) is the only colour. 64px vertical rhythm between sections, section headings sans 24px bold with −0.02em tracking, "Xem tất cả" as an outlined pill at the right of each heading.
- App (< 1024): Home header = logo, search pill, cart (US-FND-001). Hero stacked: mosaic as a 3-column strip on top, headline serif 28px, subhead 15px, pill full width. 40px between sections, 16px side margins; tab bar visible.
- No banner carousel, no auto-advance, no red anywhere on the page.

## FE notes

- `src/screens/home/HomePage.tsx` composes section components; each section owns its query and its skeleton, wrapped in a `SectionBoundary` that renders `InlineError`.
- `store.catalog.getHomeEditorial()` returns `{ headline, subhead, cta: { label, href }, mosaic: productId[], fallbacks: productId[] }`.
- `pickMosaic(mosaic, fallbacks, catalog)` pure and TDD: returns 3 active products, skipping delisted or missing ones.
- Scroll restoration via the router's scroll restoration keyed by `location.key`; recommendations pages kept in `sessionStorage` (US-FND-003).

## Mock data

- One editorial block in `src/mock/data/editorial.json` pointing at the level-1 "Đồ bếp" category and three kitchen products, with two fallbacks; test with one mosaic product delisted.

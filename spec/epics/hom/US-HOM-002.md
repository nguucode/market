---
id: US-HOM-002
title: Category shortcuts
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/"]
dependsOn: [US-HOM-001]
---

## Story

As a buyer who knows roughly what I need, I want to jump from Home into a category with one tap, so that I can browse without typing a search.

## Acceptance criteria

- Given Home, then under the hero a section headed "Mua sắm theo danh mục" shows the 10 level-1 categories as round image tiles with their names, in `sortOrder` (mock-data.md#scale).
- Given I click a tile, then I go to `/c/:slug` for that category.
- Given the web layout, then all 10 tiles sit in one row at 1440px and wrap to two rows of 5 below 1280px; there is no "Xem tất cả" because the header "Danh mục" menu holds the full tree.
- Given the app layout, then the tiles sit in a horizontally scrolling strip of two rows that shows 4½ columns so the scroll is discoverable, followed by a last tile "Tất cả danh mục" linking to `/categories`.
- Given a category name longer than one line ("Điện thoại & Phụ kiện", "Thể thao & Dã ngoại"), then it wraps to at most two lines centred under the image, never truncated.

## UI states

- Empty: if the store returns no categories, the section is omitted (US-HOM-001).
- Loading: 10 round skeletons with a text bar each (8 visible on app).
- Error: inline section error with "Thử lại" (US-FND-009).
- Unavailable: a category with no active products still shows (it is a navigation entry); its page handles the empty grid.
- Overflow: two-line labels keep tile rows aligned (fixed label block height); at 1024px the 5-per-row grid keeps tiles ≥ 96px.

## Design notes

- Web (≥ 1024): round tiles 112px with the category image cropped to a circle, label 14px ink centred under, 24px gaps, section heading sans 24px bold. This is the reference study's "explore by interest" grammar: photo-first, no icons, no coloured backgrounds.
- App (< 1024): round tiles 64px, label 12px, 2 rows, horizontal scroll with scroll-snap per column and 16px leading margin; "Tất cả danh mục" tile uses a neutral grid glyph on a paper-darker circle.
- Focus ring on the circle, 2px ink.

## FE notes

- `CategoryShortcuts.tsx` reads `store.catalog.getCategories({ level: 1 })`.
- Each tile is an `<a>` with the label as its accessible name; the image `alt=""` (decorative, label carries meaning).
- No pure logic beyond sorting; no TDD needed beyond a render test that 10 links point at `/c/:slug`.

## Mock data

- The 10 level-1 categories with one square-safe image each (centre-weighted so the circle crop works).

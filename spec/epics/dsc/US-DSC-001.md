---
id: US-DSC-001
title: Category browser
epic: DSC
priority: P0
status: Draft
size: M
routes: ["/categories"]
dependsOn: [US-FND-001, US-FND-003, US-FND-008]
---

## Story

As a buyer who knows the kind of thing I want but not its name, I want to walk the category tree in two or three taps, so that I reach a focused list without typing.

## Acceptance criteria

- Given the app layout, when I tap the tab "Danh mục", then `/categories` shows a two-pane browser: the 10 level-1 categories in a narrow left column (image + label, the first selected), and on the right the selected level-1's level-2 groups, each with a heading and its level-3 categories as round image tiles with labels.
- Given the app layout, when I tap a level-1 item on the left, then the right pane switches to its groups and scrolls to top; the left item shows the selected state and `aria-current="true"`.
- Given a level-2 heading, when I tap "Xem tất cả" beside it, then I go to `/c/:slug` of that level-2 category; when I tap a level-3 tile, I go to `/c/:slug` of that level-3 category.
- Given the web layout, when I open the header item "Danh mục", then a menu opens under the header with level-1 on the left and, on hover or focus, its level-2 groups and level-3 links on the right; Esc or a click outside closes it and returns focus to "Danh mục".
- Given the web layout, when I open `/categories` by URL, then I am redirected to `/` with the "Danh mục" menu open (sitemap.yaml `categories` note); a deep link to a category is always `/c/:slug`.
- Given the menu or the browser is open, when I use the keyboard, then arrow keys move within a column, Tab moves between columns, and Enter follows the focused link.

## UI states

- Empty: a level-1 category with no level-2 children shows its own "Xem tất cả sản phẩm" tile linking to `/c/:slug` (never a blank pane).
- Loading: left column renders from the store at once; the right pane shows 8 round tile skeletons per group until images decode.
- Error: tree fails to load → "Không tải được danh mục. Thử lại." with "Thử lại" (US-FND-009).
- Unavailable: none (categories are static mock data).
- Overflow: level-1 labels such as "Điện thoại & Phụ kiện" wrap to two lines in the 88px left column, never truncate; level-3 labels wrap to two lines under the tile then ellipsis. A level-2 group with 14 level-3 items shows all of them in a 3-column (app) or 4-column (web menu) grid.

## Design notes

- App (< 1024): page header "Danh mục" with the search pill (tapping it opens the search input state, US-DSC-003). Left column 88px on a slightly darker paper tint, selected item marked with a 2px ink bar and bold label, not a colour fill. Right pane on the paper background; level-2 headings in the serif at 18px; tiles are 64px round images, label 12px sans below.
- Web (≥ 1024): no page; a menu anchored under the header, max-width 1200, soft popover shadow from the reference study, level-1 list 240px left, level-2 headings serif 16px, level-3 as plain text links 14px in columns. No images in the web menu except the level-1 icon, to keep it scannable.
- One ink colour, no category colours; images carry the warmth.

## FE notes

- `CategoryBrowser` (app page) and `CategoryMenu` (web header menu) share one `useCategoryTree()` selector from the store (US-FND-003) and one `groupChildren(categories, parentId)` pure function (TDD: sorted by `sortOrder`, empty-parent case).
- Web redirect: a layout-aware route guard on `/categories` that navigates to `/` with `?menu=categories` consumed by the header and stripped after opening (replace, not push).
- Selected level-1 is local state; it is not in the URL.
- Menu focus management and Esc follow the side-panel pattern from US-FND-008.

## Mock data

- 10 level-1, ~45 level-2, ~120 level-3 categories from mock-data.md, each with a 1:1 image.
- One level-1 with a level-2 group of 14 level-3 categories (overflow) and one level-1 with a single level-2 (short pane).

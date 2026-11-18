# Market spec

Single source of truth for Market's information architecture and, from step 2, its user-story backlog. Project status and decisions live in the vault (`10-projects/market/_context.md`). The UI grammar reference is the vault note `10-projects/market/etsy-style-study.md`.

Market is a front-end-only, buyer-side marketplace demo for the Vietnamese market, on mock data. It is a general multi-category marketplace (Shopee/Lazada catalogue and commerce rules) presented in an Etsy-derived UI grammar. One signed-in persona, two layouts (web ≥ 1024px, app < 1024px) on one route tree, as in Wallet.

## Layout

```
spec/
  README.md               conventions (this file)
  ia/sitemap.yaml         routes, nav for both layouts, flow steps, overlays; drives the real nav
  ia/object-model.md      glossary (code term ↔ UI label), objects, enums, order state machine
  ia/rules.md             pricing and voucher math, order and return rules, law-as-UI, conventions (wins over stories)
  ia/mock-data.md         persona, catalogue scale, edge cases, demo controls
  build-order.md          P0 build waves derived from dependsOn
  epics/<code>/epic.md            one per Epic; lists its P1 backlog as a table (no files)
  epics/<code>/US-<CODE>-NNN.md   one per P0 user story
```

## Epics

| Code | Epic |
|---|---|
| FND | Shell for both layouts, nav from sitemap.yaml, VND/date formatting, mock store + latency, demo controls, /device, 404, product card, empty/loading/error patterns |
| HOM | Home: editorial hero, category shortcuts, flash sale band, themed carousels, recommendations |
| DSC | Discovery: category tree and category pages, search with suggestions and history, results with filter chips and sort |
| PDP | Product page: gallery, variant picker, price block, shipping estimate, shop card, reviews summary and list |
| SHP | Shop page: header, tabs, shop categories, shop vouchers, follow |
| CRT | Cart: lines grouped by shop, select, quantity, variant edit, shop vouchers, totals |
| CHK | Checkout: address, shipping option per shop, payment method, platform and shipping vouchers, place order, result |
| ORD | Orders: list by status, order detail with tracking timeline, cancel, confirm received, buy again |
| RET | Return and refund request, return status |
| REV | Write a review with rating, text, and photos; my reviews |
| PRM | Promotions: flash sale page, voucher hub (Kho voucher), voucher detail |
| ACC | Me (Tôi): profile, addresses, favourites, followed shops |
| NTF | Notifications |
| PRD | Product menu (P1, case-study layer, as in Fortify and Wallet) |

Roles: one (the signed-in buyer). Sellers, carriers, and payment providers are mock counterparties. Demo controls are a reviewer tool, not a role.

## Reserved IDs

Other Epics may depend on these before they are written. The owning Epic must use exactly these IDs and titles.

| ID | Title |
|---|---|
| US-FND-001 | App shell for both layouts with nav from sitemap.yaml |
| US-FND-002 | VND, date, phone, and count formatting |
| US-FND-003 | Mock store, catalogue data, and latency |
| US-FND-004 | Demo controls panel |
| US-FND-005 | Phone-frame preview at /device |
| US-FND-006 | Not-found page and error boundary |
| US-FND-007 | Product card |
| US-FND-008 | Bottom sheet and side panel pattern |
| US-CRT-001 | Cart grouped by shop |
| US-CHK-001 | Checkout page |
| US-ORD-002 | Order detail with tracking timeline |

## Story file

Same format as Wallet. The file name is the ID: `US-<CODE>-NNN.md`, NNN from 001 within each Epic, no gaps. Only P0 stories get a file; P1 items live in the Epic's backlog table.

```markdown
---
id: US-CRT-003
title: Apply a shop voucher in the cart
epic: CRT
priority: P0
status: Draft           # Draft | Ready | In design | In build | Done
size: M                 # S (about half an FE session) | M (about one session). Split anything larger.
routes: [/cart]         # base routes, must exist in ia/sitemap.yaml
dependsOn: [US-CRT-001] # P0 IDs only
---

## Story

As a buyer, I want …, so that ….

## Acceptance criteria

- Given …, when …, then ….
- (3 to 8 criteria; quote Vietnamese UI copy exactly, in quotes)

## UI states

- Empty: …
- Loading: …
- Error: …
- Unavailable: … (out of stock, delisted, voucher expired or not met, or "none")
- Overflow: … (long Vietnamese names with diacritics, 11-character prices, many shops or lines)

## Design notes

- Web layout (≥ 1024) and app layout (< 1024) for this screen. Follow `etsy-style-study.md` until DESIGN.md exists: warm paper background, one ink colour, serif headings, borderless image-led cards, black pill CTA, deal colour that is not red.

## FE notes

- Route and query params, components, store actions, pure functions to TDD (price and voucher math always TDD).

## Mock data

- Entities, demo-control scenarios from ia/mock-data.md, and edge cases this story needs.
```

## Rules

- **One story is one screen-level behaviour.** A list, a detail, and a flow are separate stories. UI states live inside each story.
- **P0** is the demo loop: Home → search or category → product page (pick a variant) → cart with two or more shops and a shop voucher → checkout (address, shipping, payment, platform voucher) → orders → order detail advanced by demo controls → confirm received → review; plus cancel and a return request, the shell, demo controls, and /device. **P1** is everything else in each Epic's backlog table, plus the Product menu.
- A P0 story's `dependsOn` lists only P0 IDs. When it would use a P1 capability, its FE notes say "Enhanced by <Epic> P1: <title>".
- [ia/rules.md](ia/rules.md) wins over any story. Stories cite the rule they apply instead of restating numbers.
- Every story covers both layouts. Story text in English; UI copy in Vietnamese using the labels in [ia/object-model.md](ia/object-model.md).

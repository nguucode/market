---
id: US-FND-003
title: Mock store, catalogue data, and latency
epic: FND
priority: P0
status: Draft
size: M
routes: ["/", "/device"]
dependsOn: []
---

## Story

As a reviewer, I want Market to behave like a real marketplace, with a full catalogue, data that changes when I act, loading I can see, and state that survives a reload and shows up on the phone frame, so that I can walk the whole demo loop without any backend.

## Acceptance criteria

- Given the app loads for the first time, then the store holds the committed seed (mock-data.md#scale: 10 level-1 categories, 40 shops, ~1.200 products, ~8.000 reviews, vouchers, 4 flash-sale slots, ~25 orders, ~40 notifications) with every date resolved from its stored offset against "now", so flash-sale slots and voucher expiry are never stale.
- Given any store read or write, when it is called, then it resolves after a seeded random delay of 250–800 ms; with the latency override set to "0 giây" or "3 giây" (US-FND-004), every action uses that delay.
- Given I change domain state (add to cart, save a voucher, place an order, advance an order) and reload, then the change is still there; "Đặt lại dữ liệu" restores the seed.
- Given per-tab working state (the checkout draft, search input text, the open flash-sale slot tab), when I reload the same tab, then it is restored, and a new tab starts clean.
- Given a state transition that has side effects (an order changes status), when it runs, then the order, its tracking event and its notification (US-NTF-002) are written in one update, so no screen renders one without the others.
- Given the demo clock is moved (US-FND-004), then every derived value (current flash-sale slot, voucher "Sắp hết hạn", relative times, payment expiry) recomputes from the new "now".
- Given `/device` and the web page are open in the same browser, when either changes the store, then the other reflects it within one second.

## UI states

- Empty: not applicable; the seed always has data. Empty screens come from user actions (empty cart) and are drawn per story with US-FND-009.
- Loading: the store exposes `status: 'idle' | 'loading' | 'error'` per query; each screen draws its own skeleton (US-FND-009).
- Error: persisted state that fails to parse, or has an older `version`, is discarded and the seed loads (console warning). A demo "Lỗi tải dữ liệu" toggle is not in P0; errors are exercised with the latency override and unit tests.
- Unavailable: the delisted product and the out-of-stock SKU stay in the seed and in the cart (mock-data.md#generation); selectors mark them, they are never filtered out at the store level.
- Overflow: search and category queries over ~1.200 products and ~8.000 reviews return a page of 20 in under 50 ms at 0 s latency; the store never hands a screen the whole catalogue.

## Design notes

- No UI of its own. Web and app layouts read the same store; skeletons are drawn by each screen in both layouts.

## FE notes

- Seed: `scripts/generate-seed.ts` with `@faker-js/faker` `vi` locale and a fixed seed, output committed to `src/mock/data/*.json` (as in Fortify and Wallet); hand-made edge cases from mock-data.md#generation are appended by name so they survive regeneration. Images: 4:5 royalty-free files, licence recorded in `src/mock/data/LICENSE.md`.
- `src/mock/store.ts`: one module-level state object with `useSyncExternalStore`; actions by domain (`store.catalog`, `store.cart`, `store.checkout`, `store.orders`, `store.returns`, `store.reviews`, `store.vouchers`, `store.notifications`, `store.account`, `store.demo`).
- Pure and TDD: `resolveOffsets(seed, now)`, `paginate(items, page, size)`, `queryProducts(catalog, query)` (shared by DSC and SHP), `transitionOrder(order, event, now)` against the state machine in object-model.md (illegal transitions throw).
- `now()` = `Date.now() + clockOffset`; nothing in `src/` calls `new Date()` for "now" (lint rule).
- Persistence: domain state in `localStorage` key `market.state.v1` with a `version` field; per-tab drafts in `sessionStorage` key `market.session.v1`. Both wrapped in try/catch (private mode). Sync: `BroadcastChannel('market')` posts a version number on every commit; receivers re-read `localStorage`. `storage` event as fallback.
- Latency: `delay()` uses a seeded PRNG so screenshots are reproducible; override is held in `store.demo.latency`.

## Mock data

- The full seed of mock-data.md and every hand-made edge case: the 2×6 variant product with dead combinations, the delisted product and out-of-stock SKU in the cart, the 3-shop cart with a shop voucher 23.000₫ below its minimum and a COD-off shop, the §4.3 worked example, the payment-restricted and 2-hour-expiry platform vouchers, an order in every status, the 120-character product name, the 40-character shop name, and the `12.499.000₫` price.

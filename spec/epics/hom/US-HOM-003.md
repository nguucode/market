---
id: US-HOM-003
title: Flash sale band on Home
epic: HOM
priority: P0
status: Draft
size: M
routes: ["/"]
dependsOn: [US-HOM-001, US-FND-007]
---

## Story

As a buyer, I want to see what is on flash sale right now and how long it lasts, in one calm band, so that I can catch a real deal without the page shouting at me.

## Acceptance criteria

- Given a flash-sale slot is active, then Home shows one band headed "Flash sale" with the status text "Đang diễn ra · Kết thúc sau 1 giờ 23 phút" and a "Xem tất cả" pill linking to `/flash-sale`; the countdown is text, updated once a minute, with no ticking seconds, flashing or animation (research §7.2).
- Given the active slot, then the band shows its first 10 items as a horizontal rail of product cards in the flash variant (US-FND-007): slot price in the deal colour, `-NN%` against `priceBeforePromo` (rules.md#price-display), and the sold bar "Đã bán {sold}"; sold-out items move to the end of the rail labelled "Đã bán hết".
- Given less than 1 hour remains, then the status reads "Kết thúc sau 23 phút"; given the slot ends while I am on Home, then within one minute the band switches to the next slot without a reload.
- Given no slot is active but one starts later today or tomorrow, then the band reads "Sắp diễn ra · Bắt đầu lúc 18:00" (or "Bắt đầu lúc 00:00 ngày mai"), shows that slot's items with their slot prices, and the cards link to the product page, where the normal price applies until the slot starts.
- Given no slot today or tomorrow, then the band is omitted (US-HOM-001).
- Given I click a card, then I go to `/p/:slug` with the SKU preselected (`?sku=`) when the flash item is a single SKU.
- Given "Bắt đầu khung flash sale tiếp theo" in Demo controls (US-FND-004), then the band shows the new slot within one second.

## UI states

- Empty: no slot → section omitted.
- Loading: heading bar and 5 (web) or 2½ (app) card skeletons in the flash variant.
- Error: inline section error with "Thử lại".
- Unavailable: a flash item whose product is delisted is dropped from the rail; an item at 100% sold stays at the end, dimmed, "Đã bán hết".
- Overflow: `12.499.000₫` slot prices fit the rail card; a slot with fewer than 5 items does not stretch cards (they keep rail width, left aligned); "Kết thúc sau 23 giờ 59 phút" fits on one line at 375px beside the heading or wraps under it, never over "Xem tất cả".

## Design notes

- Web (≥ 1024): a full-width band on a light tint of the deal colour (the only tinted band on Home), 32px padding; heading sans 24px bold "Flash sale" with the status text 14px in ink at 80% beside it; rail of 5 visible cards (≈ 220px) with prev/next round buttons at the edges; sold bar 4px high, deal colour on a 15% deal-colour track.
- App (< 1024): band edge-to-edge, heading and status stacked, "Xem tất cả" as text link right of the heading; rail shows 2½ cards (≈ 140px) with scroll-snap; no arrow buttons.
- Never red, never a lightning-bolt animation, never a ticking clock graphic. The sold bar is the single scarcity signal, as in the reference study's quiet "only a few left" line.

## FE notes

- `FlashSaleBand.tsx` reads `store.promotions.getFlashSlots()` and subscribes to a one-minute clock tick from the store (`now()`, US-FND-003).
- Pure and TDD: `flashSlotState(slots, now)` → `{ active?, next?, endsInMs?, startsInMs? }` (shared with US-PRM-001); `formatCountdown(ms)` → "1 giờ 23 phút" / "23 phút" / "dưới 1 phút"; `orderFlashItems(items)` (sold-out last, otherwise seed order).
- Cards are US-FND-007 with `variant="flash"` and the `flashItem`.

## Mock data

- 2 slots today and 2 tomorrow with 20 items each (mock-data.md#scale); in the seed one item at 92% sold, one at 100%, and one whose product is delisted. Test the boundary by jumping the clock to 1 minute before the slot end.

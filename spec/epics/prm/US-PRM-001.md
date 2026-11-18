---
id: US-PRM-001
title: Flash sale page
epic: PRM
priority: P0
status: Draft
size: M
routes: ["/flash-sale"]
dependsOn: [US-FND-001, US-FND-007, US-FND-003, US-HOM-003]
---

## Story

As a buyer, I want to see every item in the current flash-sale slot and what comes next, with the real discount and how much is left, so that I can decide quickly without being rushed by a flashing clock.

## Acceptance criteria

- Given I open `/flash-sale`, then the page titled "Flash sale" shows slot tabs for the current slot and every upcoming slot today and tomorrow, labelled by start time with a status line: "12:00" / "Đang diễn ra", "18:00" / "Sắp diễn ra", "00:00" / "Ngày mai"; ended slots are not shown. The active slot's tab is selected by default and the selection is kept in `?slot=`.
- Given the active slot's tab, then under the tabs one line reads "Kết thúc sau 1 giờ 23 phút" (text, updated once a minute, `formatCountdown` from US-HOM-003), and the grid shows all 20 items as product cards in the flash variant (US-FND-007): slot price in the deal colour, `-NN%` against `priceBeforePromo` (rules.md#price-display), sold bar "Đã bán {sold}", "Sắp hết" at 90% or more.
- Given an item has a `perBuyerLimit`, then its card adds "Tối đa {n} sản phẩm" under the sold bar; the cart and PDP charge extra units at the normal price (rules.md#price-display), not this story.
- Given an upcoming slot's tab, then the line reads "Bắt đầu lúc 18:00" (or "Bắt đầu lúc 00:00 ngày mai"), cards show the slot price and `-NN%` with the sold bar replaced by "Sắp diễn ra", and each card links to the product page where the normal price applies until the slot starts.
- Given the active slot ends while the page is open, then within one minute its tab disappears, the next slot becomes "Đang diễn ra" and is selected, and its prices apply; Demo controls "Bắt đầu khung flash sale tiếp theo" does the same within one second.
- Given an item is 100% sold, then it moves to the end of the grid, dimmed, labelled "Đã bán hết", and still links to its product page.
- Given I open `/flash-sale?slot=` with an ended or unknown slot id, then the page selects the active slot (or the next one) and replaces the URL.

## UI states

- Empty: no slot today or tomorrow → "Chưa có Flash sale nào. Quay lại sau nhé." with "Về Trang chủ" (US-FND-009).
- Loading: tab skeletons and 10 flash-card skeletons.
- Error: full error state with "Thử lại" (US-FND-009).
- Unavailable: an item whose product is delisted is removed from the grid; a slot whose items are all sold out still shows, every card "Đã bán hết".
- Overflow: 4 tabs fit at 375px without scrolling (time + one short status line each); 20 items with 120-character names truncate per card; `12.499.000₫` slot prices fit the 2-column app card.

## Design notes

- Web (≥ 1024): page heading "Flash sale" in serif 36px on the paper background, a light deal-colour tint band holding the slot tabs as wide segmented pills (time bold 18px, status 12px), the selected tab in ink with paper text; countdown line 14px under the band; 5-column grid at 1440, 4 at 1024.
- App (< 1024): back + "Flash sale" header with cart; tabs sticky under the header as a 4-segment row; countdown line under them; 2-column grid; tab bar hidden (not a tab route).
- Same calm voice as Home: no red, no seconds, no animated bolt; the sold bar is the one scarcity signal.

## FE notes

- `src/screens/promotions/FlashSalePage.tsx`; `?slot=` via the router search params.
- Reuse `flashSlotState(slots, now)` and `formatCountdown(ms)` from US-HOM-003; add `visibleSlots(slots, now)` (pure, TDD: excludes ended, sorted, max today + tomorrow) and `resolveSelectedSlot(param, slots, now)` (pure, TDD: falls back to active, then next).
- Subscribes to the store's one-minute tick; the Demo controls clock jump triggers an immediate re-render through the store.
- Enhanced by PRM P1: "Nhắc tôi" reminders for upcoming flash-sale slots.

## Mock data

- 2 slots today and 2 tomorrow, 20 items each (mock-data.md#scale), with per-buyer limits on some items, one item at 92% sold, one at 100%, one with a delisted product, and one priced `12.499.000₫`. Slot times stored as offsets so "today" is always today.

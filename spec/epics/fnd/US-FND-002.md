---
id: US-FND-002
title: VND, date, phone, and count formatting
epic: FND
priority: P0
status: Draft
size: S
routes: ["/"]
dependsOn: []
---

## Story

As a buyer, I want every price, date, phone number and count written the way Vietnamese shoppers write them, the same on every screen, so that I can compare prices at a glance and never doubt an amount.

## Acceptance criteria

- Given any money value, when it is shown, then it uses `formatVnd` from one module: whole đồng, dot thousands separator, `₫` directly after with no space (`330.448₫`, `12.499.000₫`, `0₫`), per rules.md#spec-conventions; a discount or refund line prefixes a real minus "-" with no space (`-50.000₫`). No screen calls `Intl.NumberFormat` or `toLocaleString` for money.
- Given a money value in a chip, filter or themed-rail title, when the compact form is used, then it reads `200K`, `1,2Tr`, `15Tr` (one decimal at most, decimal comma, trailing ",0" dropped, rounded down) and never appears in a price block, cart, checkout or order.
- Given a date or time, then it reads `18/11/2026` and `14:05`; given a timestamp less than 24 hours old, then it reads "Vừa xong" (under 1 minute), "{n} phút trước" or "{n} giờ trước"; at 24 hours or more it reads the absolute date. A date range reads "21/11 – 23/11" within the same year.
- Given a phone number, then it reads `0905 123 456` (4-3-3 grouping); a number that is not 10 digits is shown as entered, ungrouped.
- Given a count, then sold counts read "Đã bán 999", "Đã bán 1,2k", "Đã bán 12k", "Đã bán 1,2tr"; review counts read "(222)"; followers read "1,5k người theo dõi"; ratings read "4,8" (one decimal, decimal comma).
- Given a percentage badge, then it reads `-NN%` rounded down, computed from `priceBeforePromo` (rules.md#price-display).

## UI states

- Empty: `null`/`undefined` money renders "—", never "0₫" or "NaN₫".
- Loading: not applicable (pure functions).
- Error: a non-integer money input throws in dev and rounds to whole đồng in production (VND has no minor unit); a test asserts both.
- Unavailable: none.
- Overflow: the longest seeded values (`12.499.000₫`, a 13-character order total such as `112.499.000₫`) must render on one line in the card, cart line and totals bar; `₫` never wraps away from the digits (the formatter output contains no space to break on).

## Design notes

- No UI of its own. Both layouts use the same functions. Prices use tabular figures (`font-variant-numeric: tabular-nums`) in totals and cart columns so amounts align; cards keep proportional figures.

## FE notes

- `src/lib/format.ts`, all pure and TDD with a table of cases: `formatVnd(n)`, `formatVndSigned(n)`, `formatVndCompact(n)`, `formatDate(d)`, `formatTime(d)`, `formatRelative(d, now)`, `formatDateRange(a, b)`, `formatPhone(s)`, `formatSold(n)`, `formatCount(n)`, `formatRating(x)`, `discountPercent(price, priceBeforePromo)`.
- `formatVnd` builds the string by hand (group digits with `.`), not from `Intl`, because `Intl` for `vi-VN` inserts a narrow no-break space before `₫` (rules.md#spec-conventions).
- `formatRelative` takes `now` from the store clock (US-FND-003), never `new Date()`, so demo clock jumps re-render relative times.
- An ESLint `no-restricted-syntax` rule flags `toLocaleString` and `Intl.NumberFormat` outside `format.ts`.

## Mock data

- Test cases drawn from the seed: `189.000₫`, `1.249.900₫`, `12.499.000₫`, the §4.3 example totals (`723.000₫`, `653.000₫`), sold counts 0, 999, 1.200, 12.000, 1.200.000, the persona's phone `0905 123 456`.

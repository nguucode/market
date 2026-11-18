---
id: US-PRM-002
title: Claim vouchers and the voucher hub
epic: PRM
priority: P0
status: Draft
size: M
routes: ["/vouchers"]
dependsOn: [US-FND-001, US-FND-003, US-FND-010]
---

## Story

As a buyer, I want to save vouchers with one tap wherever I see them and find all of them in one place, so that I know what discounts I hold before I reach checkout.

## Acceptance criteria

- Given any voucher tile (here, on Home, PDP, shop page, cart), then it shows the offer ("Giảm 15%" or "Giảm 30.000₫"; "Miễn phí vận chuyển" for shipping vouchers), the cap and minimum ("Tối đa 50.000₫ · Đơn tối thiểu 300.000₫"), the expiry ("HSD: 30/11/2026", or "Hết hạn sau 2 giờ" under 24 hours), the owner for shop vouchers ("Voucher của Shop" + shop name), a "Điều kiện" link (US-PRM-003) and one action.
- Given a voucher I have not saved, active, with quota left, when I press "Lưu", then the button shows a spinner, the store adds a SavedVoucher, the button becomes "Dùng ngay", and the toast "Đã lưu voucher" appears (US-FND-010); the change shows on every surface showing that voucher, including `/device`, within one second.
- Given a saved voucher, when I press "Dùng ngay", then shop vouchers go to `/s/:handle` and platform and shipping vouchers go to `/cart`.
- Given the quota ran out or the voucher expired between render and press, then the press fails with the inline line "Voucher đã hết lượt lưu." or "Voucher đã hết hạn." under the tile, nothing is saved, and the tile's action becomes "Đã hết lượt" (disabled) or disappears on the next render.
- Given I open `/vouchers`, then the page titled "Kho voucher" has tabs "Tất cả", "Voucher Market", "Voucher của Shop", "Voucher miễn phí vận chuyển", "Sắp hết hạn" (`?tab=all|platform|shop|shipping|expiring`); each tab lists saved vouchers first, then claimable ones, each group sorted by soonest expiry.
- Given the "Sắp hết hạn" tab, then it lists saved vouchers that end within 3 days, unused.
- Given a saved voucher has reached its `perBuyerLimit`, or has expired, then it is not listed in P0 (history is PRM P1); given a voucher I have used once of a limit of two, its tile adds "Còn 1 lượt dùng".

## UI states

- Empty: per tab, "Bạn chưa có voucher nào ở đây." with, in "Tất cả" only, "Khám phá sản phẩm" (→ `/`); "Sắp hết hạn" empty reads "Không có voucher nào sắp hết hạn."
- Loading: 6 tile skeletons; the tab bar renders immediately.
- Error: full error state with "Thử lại"; a failed claim is inline on the tile.
- Unavailable: exhausted (quota) → "Đã hết lượt", disabled; expired → removed; payment-restricted vouchers show the restriction line ("Chỉ áp dụng khi thanh toán bằng Ví Sen") but stay claimable.
- Overflow: 40-character shop names truncate to one line on the tile; ~90 shop vouchers in "Voucher của Shop" render 20 at a time with "Xem thêm"; tabs scroll horizontally at 375px with the selected one kept in view.

## Design notes

- Web (≥ 1024): page heading "Kho voucher" serif 36px, tabs as an underline row, tiles in a 2-column list max-width 960. Tile: horizontal, offer block left (96px wide) on a light editorial tint (platform: one tint, shop: shop avatar on paper, shipping: a second tint), details right in ink, action pill right (outlined "Lưu", black "Dùng ngay", muted disabled "Đã hết lượt").
- App (< 1024): back + "Kho voucher" header, horizontally scrolling tabs, single-column tiles full width; tab bar hidden.
- No red, no perforated ticket edges, no shaking "Lưu" buttons; the deal colour is used only on the offer text "Giảm 15%".

## FE notes

- `src/components/voucher/VoucherTile.tsx` (shared) and `useClaimVoucher(id)`; `src/screens/promotions/VoucherHubPage.tsx` with `?tab=`.
- Store: `store.vouchers.claim(id)` → `{ ok: true } | { ok: false, reason: 'exhausted' | 'expired' | 'already_saved' }`, idempotent on double press.
- Pure and TDD: `voucherTileState(voucher, saved, now)` → `'claimable' | 'saved' | 'exhausted' | 'used_up' | 'expired'`; `voucherOffer(voucher)` and `voucherMeta(voucher, now)` (copy strings, via US-FND-002 formatters); `hubList(vouchers, saved, tab, now)` (grouping, sort, expiring window). Voucher application math is not here (rules.md#voucher-math, CRT/CHK).
- `useDeferredValue` not needed; lists are small after paging.

## Mock data

- 6 platform, 3 shipping, 2-4 per shop (mock-data.md#scale); in the seed: one platform voucher saved, one shop voucher used 1 of 2, one with quota exhausted, the payment-restricted one, the one expiring in 2 hours, and the shop voucher 23.000₫ below its minimum in the 3-shop cart.

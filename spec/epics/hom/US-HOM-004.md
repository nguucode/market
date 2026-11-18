---
id: US-HOM-004
title: Claimable voucher strip on Home
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/"]
dependsOn: [US-HOM-001, US-PRM-002]
---

## Story

As a buyer, I want to save a few Market-wide vouchers right from Home, so that the discount is waiting for me at checkout without a trip to the voucher hub.

## Acceptance criteria

- Given Home, then a section headed "Voucher Market" shows 2 to 3 platform vouchers (`sitemap.yaml#screens.home.sections`) that are active and not exhausted, best first by value for the persona, each as the shared voucher tile from US-PRM-002, with "Xem thêm" linking to `/vouchers`.
- Given a tile, then it reads the offer ("Giảm 15%"), the cap and minimum on one line ("Tối đa 50.000₫ · Đơn tối thiểu 300.000₫"), the expiry ("HSD: 30/11/2026", or "Hết hạn sau 2 giờ" when under 24 hours), and the action "Lưu"; "Điều kiện" opens the conditions sheet (US-PRM-003).
- Given I press "Lưu", then the claim behaviour of US-PRM-002 runs: the button becomes "Đã lưu" for the toast "Đã lưu voucher", then "Dùng ngay", and the voucher appears in "Kho voucher".
- Given a voucher was already saved, then its tile shows "Dùng ngay" from the start; given every candidate voucher is saved, the strip still shows them with "Dùng ngay" so the buyer sees what is waiting.
- Given a voucher's quota runs out or it expires while the strip is visible, then pressing "Lưu" shows the inline result from US-PRM-002 ("Voucher đã hết lượt lưu." or "Voucher đã hết hạn.") and the tile is replaced by the next candidate on the next render.

## UI states

- Empty: no active platform voucher → section omitted (US-HOM-001).
- Loading: 3 tile skeletons (web) or 1½ (app).
- Error: inline section error with "Thử lại"; a failed claim is inline on the tile (US-PRM-002).
- Unavailable: exhausted or expired vouchers are never candidates; a saved voucher already used up (`perBuyerLimit`) is skipped.
- Overflow: offer text up to "Giảm 1.000.000₫" and the 2-hour expiry line fit a tile at 375px; a payment-restricted voucher adds a fourth line "Chỉ áp dụng khi thanh toán bằng Ví Sen" truncated to one line.

## Design notes

- Web (≥ 1024): three tiles in a row within the content width, each a horizontal ticket (offer block left on a light editorial tint, details right, small outlined pill "Lưu" or black pill "Dùng ngay"); section heading sans 24px with "Xem thêm" outlined pill.
- App (< 1024): horizontal scroll, tiles 280px wide with 1½ visible, scroll-snap.
- Tile visuals are owned by US-PRM-002; this story only places them. No perforated-edge ticket gimmick in red; the tint is from the editorial palette, not the deal colour.

## FE notes

- `VoucherStrip.tsx` reads `store.vouchers.list({ scope: 'platform', claimable: true })` and renders `VoucherTile` from US-PRM-002.
- `pickHomeVouchers(vouchers, saved, now)` pure and TDD: active, not exhausted, not used up, sorted by `estimatedValue` (amount, or `min(pct × typicalBasket, maxDiscount)` with a fixed `typicalBasket` constant), top 3.
- "Dùng ngay" target follows US-PRM-002 (`/cart` for platform vouchers).

## Mock data

- 6 platform vouchers (mock-data.md#scale), including the payment-restricted one and the one expiring in 2 hours; one platform voucher already saved in the seed.

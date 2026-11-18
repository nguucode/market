---
id: US-CHK-001
title: Checkout page
epic: CHK
priority: P0
status: Draft
size: M
routes: ["/checkout"]
dependsOn: [US-CRT-002, US-FND-002]
---

## Story

As a buyer, I want one checkout page that shows every shop's items, delivery, promotions by name, the full money breakdown, and the payment method, all changeable in place, so that I know exactly what I am agreeing to before I press "Đặt hàng".

## Acceptance criteria

- Given I come from the cart with selected lines from two shops, when `/checkout` loads, then it shows in this order: the address block (US-CHK-002), one block per shop, the "Voucher Market" row (US-CHK-005), the payment method row (US-CHK-004), "Chi tiết thanh toán", and the place-order area; the page title is "Thanh toán" (never "Đặt hàng").
- Given a shop block, then it shows the shop name, each line (image, name, "Phân loại: …", unit price, "x{qty}", line total), the applied shop voucher by label and amount (carried from US-CRT-005; the best eligible one pre-applied if none was chosen), the shipping option with carrier, fee, and "Nhận hàng 21/11 – 23/11" (US-CHK-003), a field "Lời nhắn cho Shop" (optional, up to 200 characters), and the line "Tổng số tiền ({k} sản phẩm): {shopTotal}₫".
- Given the page, then "Chi tiết thanh toán" lists "Tổng tiền hàng", "Tổng phí vận chuyển", then one line per applied voucher with its scope and label, for example "Voucher của Shop · {shop}: Giảm 30.000₫  −30.000₫", "Voucher Market: Giảm 15% tối đa 50.000₫  −50.000₫", "Voucher miễn phí vận chuyển  −47.000₫", and "Tổng thanh toán"; there is never one lump "Giảm giá" line (rules.md#checkout-disclosures).
- Given the total, then directly under "Tổng thanh toán" the note "Giá đã bao gồm VAT" shows, and no VAT line is ever added (rules.md#price-display).
- Given the place-order area, then the black pill "Đặt hàng" sits with the line "Nhấn Đặt hàng đồng nghĩa với việc bạn đồng ý với Điều khoản của Market", where "Điều khoản của Market" links to `/policies/dieu-khoan` (rules.md#checkout-disclosures).
- Given the §4.3 cart (Shop A 478.000₫, Shop B 245.000₫, the 15% platform voucher capped at 50.000₫, the shipping voucher capped at 25.000₫ per shop, fees 22.000₫ and 35.000₫), then "Tổng tiền hàng" is 723.000₫ and "Tổng thanh toán" is 653.000₫, and each shop block's total matches the per-order amounts 415.677₫ and 237.323₫.
- Given I open `/checkout` with no selected lines (direct URL, refresh after placing), then I am redirected to `/cart`.

## UI states

- Empty: no selected lines → redirect to `/cart` (above).
- Loading: skeleton of the address block, one shop block, and the totals; "Đặt hàng" disabled until pricing resolves.
- Error: catalogue or pricing load fails → "Không tải được trang thanh toán." with "Thử lại" (US-FND-009); nothing can be placed.
- Unavailable: a line that became unavailable after leaving the cart is caught at place-order time (US-CHK-006); a voucher that stops holding is removed with an inline note in its own block (rules.md#voucher-math item 6).
- Overflow: 8 shops scroll as stacked blocks; a 13-character total (`112.499.000₫`) fits the totals column and the app bar; the 40-character shop name truncates; "Lời nhắn cho Shop" shows "{n}/200" and stops at 200.

## Design notes

- Web (≥ 1024): focused shell (logo and a quiet step label, no search). Two columns: left fluid with address, shop blocks, voucher and payment rows as plain sections on the paper background separated by hairlines; right 380px sticky column with "Chi tiết thanh toán", "Giá đã bao gồm VAT", the consent line, and a full-width 48px black pill "Đặt hàng". Discount amounts in the deal colour.
- App (< 1024): back + "Thanh toán" header, tab bar hidden; everything stacks; "Chi tiết thanh toán" is a section near the bottom; a sticky bottom bar shows "Tổng thanh toán {x}₫" with "Tiết kiệm {y}₫" under it and the black pill "Đặt hàng"; the consent line sits just above the bar at 12px.
- Every changeable row (address, shipping option, vouchers, payment) is a full-width tappable row with a chevron, opening the overlay listed in sitemap.yaml.

## FE notes

- Route `/checkout`, page `CheckoutPage`; overlays address-sheet, address-form, shipping-sheet, payment-sheet, voucher-sheet (sitemap.yaml).
- Store slice `checkout.session`: selected line ids, `addressId`, `shippingOption[shopId]`, `shopVoucher[shopId]`, `platformVoucherId`, `shippingVoucherId`, `paymentMethod`, `messageToShop[shopId]`; created from the cart selection on entry and kept across reloads.
- Pure engine, TDD first, in `src/lib/pricing/priceCheckout.ts`: `priceCheckout({ shops, address, vouchers, paymentMethod, coins = 0, now })` → per-shop `{ goods, shopDiscount, net, platformAlloc, shippingFee, shippingDiscount, payable }` plus session totals and the `disclosures` list that renders "Chi tiết thanh toán". It composes `shopVoucherDiscount`, `bestShopVoucher` (US-CRT-005), `platformVoucherDiscount`, `shippingVoucherDiscount` (US-CHK-005), `shippingQuote` (US-CHK-003), and `allocateLargestRemainder(total, weights)`.
- Test fixture `src/lib/pricing/__fixtures__/research-4-3.ts` (research note §4.3): goods 478.000 / 245.000 = 723.000; shop discount 30.000 / 0; net 448.000 / 245.000; platform 15% capped → 50.000 split 32.323 / 17.677 by largest remainder; shipping 22.000 / 35.000 with discount 22.000 / 25.000; payable 415.677 / 237.323 = **653.000₫** with `coins = 0`. The same fixture with `coins = 12.000` gives 408.038 / 232.962 = 641.000₫, proving the P1 Xu input needs no math change.
- Invariant tests (property-style over generated carts): Σ order payable = session total, every order ≥ 0, `allocateLargestRemainder` returns integers that sum to the input.

## Mock data

- The §4.3 cart reproducible from seed (ia/mock-data.md): Shop A and Shop B, the 15% platform voucher capped at 50.000₫, and the shipping voucher capped at 25.000₫ per shop, all saved by the persona.
- The seeded three-shop cart for the general case, including the COD-off shop.
- Terms page `/policies/dieu-khoan` from US-FND-011.

# Mock data

All shops, products, people, and carriers are fictional. Product photos come from a royalty-free source chosen at build time (licence recorded in the repo); no real brand logos or trademarks in names. Every screen shows a small **Dữ liệu mẫu** badge. Fictional payment names: wallets "Ví Sen", "Ví Mây"; bank "Ngân hàng Sông Hàn".

## The persona

**Lê Thu Hà**, 29, Đà Nẵng, office worker who shops on her phone at lunch and on the laptop in the evening. Phone `0905 123 456` (fictional). Two saved addresses: Nhà (default, Đà Nẵng) and Văn phòng (Đà Nẵng). A third address in Hà Nội (gift for her mother) is added during the demo.

## Scale

| Entity | Count |
|---|---|
| Level-1 categories | 10: Thời trang nữ, Thời trang nam, Nhà cửa & Đời sống, Đồ bếp, Sắc đẹp, Điện thoại & Phụ kiện, Máy tính & Laptop, Mẹ & Bé, Thể thao & Dã ngoại, Nhà sách |
| Level-2 / level-3 categories | ~45 / ~120 |
| Shops | 40 (6 official), spread over Hà Nội, TP.HCM, Đà Nẵng, plus 2 cross-border shops shipping from abroad |
| Products | ~1.200; 70% with 1-2 variant dimensions, up to 30 SKUs per product |
| Reviews | ~8.000; ~20% with photos |
| Vouchers | 6 platform, 3 shipping, 2-4 per shop |
| Flash sale | 2 slots today + 2 tomorrow, 20 items each |
| Persona's orders | ~25 over 6 months, covering every status at least once |
| Notifications | ~40, latest 6 unread |

## Generation

- `@faker-js/faker` with the `vi` locale and a fixed seed; JSON committed to `src/mock/data/`, as in Fortify and Wallet.
- Dates stored as offsets from "today" and resolved at app load, so flash-sale slots and voucher expiry never go stale.
- Prices are whole đồng ending in 000 or 900 (e.g. 189.000₫, 1.249.900₫). ~40% of SKUs have a `priceBeforePromo`; the discount is 5-50%, never more (rules.md#price-display).
- Shops carry fictional legal name, business address, and business code; 3 shops have COD off.
- Hand-made edge cases (always present):
  - A product with 2 dimensions × 6 options where some combinations are out of stock and one option has no stock at all.
  - A delisted product and an out-of-stock SKU already sitting in the cart.
  - A cart with 3 shops: one with a shop voucher just below its minimum spend ("Mua thêm 23.000₫ để dùng voucher"), one with COD off.
  - The research worked example (rules.md#voucher-math item 7) reproducible from seed: Shop A 478.000₫, Shop B 245.000₫, a 15% platform voucher capped at 50.000₫, a shipping voucher capped at 25.000₫ per shop.
  - A platform voucher that only works with one payment method, and one that expires in 2 hours.
  - An order in every status, including a COD order that failed delivery and a return request awaiting the shop.
  - A 120-character Vietnamese product name and a 40-character shop name for overflow.
  - An 11-character price (`12.499.000₫`) and a 14-character order total (`112.499.000₫`).

## Demo controls

Same pattern as Wallet: a panel for reviewers, never part of the persona's UI.

- Advance any order to its next status, or fail it (delivery failed, payment expired).
- Shop response to a cancel request: accept or refuse.
- "Hoàn tiền xong": finish the refund of a cancelled paid order.
- Next place-order: "Giá thay đổi khi đặt hàng" or "Hết hàng khi đặt hàng" (one shot, then back to "Bình thường").
- Decide the outcome of the next online payment: success, failure, timeout.
- Return request: approve refund only, approve return, ask for evidence, reject; then advance return shipping and inspection.
- Jump the clock: start the next flash-sale slot, expire a voucher.
- Reset to seed.

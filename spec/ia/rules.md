# Rules

This file wins over any story. Stories cite a section (`rules.md#voucher-math`) instead of restating numbers. Sources: vault research note `2026-11-18-vn-marketplace-domain-and-ia.md` (section numbers given as §). Tags: **[Law]** from a statute, **[Policy]** from a marketplace help centre, **[Demo]** a decision for this demo with no source.

## Spec conventions

- UI copy in Vietnamese, labels from [object-model.md](object-model.md#glossary-code-term--ui-label). Story text in English.
- **Money:** VND, whole đồng, dot thousands separator, `₫` directly after with no space: `330.448₫` [Demo, §3.3]. One formatter for the whole app; do not use the raw `Intl` output (it inserts a narrow space). Never a comma separator. Compact form only in chips and filters: `200K`, `1,2Tr`.
- **Dates:** `18/11/2026`, times `14:05`, relative only under 24 h ("2 giờ trước").
- **Phone:** `0905 123 456`.
- **Counts:** `Đã bán 1,2k`, `(222)` for review counts, `1,5k người theo dõi`.
- Every screen has a **Dữ liệu mẫu** badge and works at 375 px and at 1440 px.

## Price display

- All prices include VAT and every fee the shop charges; there is never a VAT line added at checkout [Law: Luật Giá 2023 Đ.29, §3.3]. Checkout shows the note "Giá đã bao gồm VAT" under the total.
- A struck-through price is `priceBeforePromo` (the price right before the promotion), never an arbitrary "original price" [Law: NĐ 81/2018 sửa bởi NĐ 128/2024, §3.4].
- The discount shown on a product may not exceed **50%** of `priceBeforePromo` [Law, §3.4]. Mock data never breaks this and has no "1.000₫" shock deals. Badge `-NN%` rounds down.
- The discount colour is the single deal colour from DESIGN.md, never red. A card in a grid shows the price and at most one label [Demo, §7.2].
- A product with several SKU prices shows a range `189.000₫ – 249.000₫` until a full combination is picked.
- Inside an active flash-sale slot the slot price replaces the SKU price for up to `perBuyerLimit` units; extra units are charged at the normal price and the cart says so.

## Voucher math

Per checkout session, three voucher slots and the order they apply in [Policy, §4.1]:

1. **Shop voucher**: at most one per shop, on that shop's goods subtotal (selected lines). Needs `goods ≥ minSpend`. The best eligible shop voucher is pre-applied at checkout [Policy]. Below the minimum, the shop group shows "Mua thêm {x}₫ để dùng voucher".
2. **Platform voucher**: at most one per session, on Σ shop `net` (goods − shop discount), shipping excluded; `minSpend` is checked against that same base [Demo, §4.2]. May be restricted to a payment method; when the method changes and the voucher no longer applies, it is removed with an inline note.
3. **Shipping voucher**: at most one per session; reduces each shop's shipping fee by up to `maxPerShop`, never below 0 [Demo, §4.2].
4. Percent vouchers: `min(floor(base × pct), maxDiscount)`. Amount vouchers: `min(value, base)`.
5. Session-level discounts are split across shop orders pro rata to each shop's `net`, using **largest remainder** so the orders always sum exactly to the session total [Demo, §4.2]. This invariant is a unit test.
6. A voucher whose conditions stop holding (line deselected, qty change, payment method change) is removed with an inline note, never kept silently.
7. Worked example to test against: §4.3 of the research note (723.000₫ goods → 641.000₫ with Xu; 653.000₫ without Xu).
8. **Xu (coins) is P1.** The engine takes a `coins` input defaulting to 0 so P1 adds it without changing the math: applied after all vouchers, at most 50% of the payable amount [Policy, §4.1].

## Shipping

- Each shop order picks its own carrier option; the buyer may choose the carrier [Law: Luật TMĐT Đ.17 k.3-4, §3.2]. Carriers are fictional names.
- Fee depends on option, buyer province vs shop province, and weight; a fixed table in mock data.
- Estimated delivery shown as a date range ("Nhận hàng 21/11 – 23/11").
- `Hỏa tốc` only when shop and address are in the same province.

## Payment

- Methods in P0, in this order: **Thanh toán khi nhận hàng** (default), **Chuyển khoản ngân hàng (VietQR)**, **Ví điện tử** (fictional wallet names, text only), **Thẻ tín dụng/ghi nợ**. Installment is P1 [Demo, Q5].
- COD can be off per shop; that shop's group says so and the method is disabled for the session with the reason [Policy, §7.2]. COD cap per order 10.000.000₫ [Demo].
- Online methods create one `Payment` for all orders of the session with a 15-minute expiry; orders sit in `awaiting_payment` ("Chờ thanh toán") until paid, and are cancelled by the system at expiry [Demo, §2.2].
- Mock screens: VietQR shows a QR, the amount, and a countdown; card shows a form that accepts only test values and says so; wallet shows a confirm step. Demo controls decide success, failure, or timeout.

## Checkout disclosures

- Before "Đặt hàng" the page shows, and lets the buyer change in place: items and quantities per shop, carrier and delivery estimate, **each promotion by name and amount** (never one lump "Giảm giá"), the money breakdown (goods, shipping, each voucher, total), and the payment method [Law: Luật TMĐT Đ.12 k.1-2, §3.2].
- "Đặt hàng" sits with the line "Nhấn Đặt hàng đồng nghĩa với việc bạn đồng ý với Điều khoản của Market" linking to the terms page [Law, Đ.12 k.1].
- The order keeps a snapshot of prices, vouchers, and fees at the time of order and never recalculates [Law, Đ.12 k.3].

## Order rules

States and labels are in [object-model.md](object-model.md#order-state-machine). One checkout with n shops creates n orders [Demo, Q3].

- `awaiting_payment`: buyer may cancel at once; the system cancels at payment expiry.
- `to_confirm` ("Chờ xác nhận"): buyer may cancel at once [Policy, §2.2].
- `to_ship` ("Chờ lấy hàng"): buyer sends a **cancel request**; the shop accepts (cancelled) or refuses (order continues). **One request per order**; once refused or withdrawn it cannot be sent again [Policy].
- `shipping`: no cancel in P0 [Policy, §2.2].
- Failed delivery (demo control): order goes to `cancelled` with reason "Giao hàng không thành công"; a paid order is refunded.
- `delivered` → `completed` when the buyer taps "Đã nhận được hàng", or automatically 15 days after delivery [Demo; exact auto-confirm days unsourced, §2.2].
- Refund destination follows the paid method: VietQR/wallet → back to the source within 24 h (mock), card → same card in 7-14 working days. A cancelled COD order has nothing to refund and says so [Policy, §2.3].
- Order detail has "Tải hóa đơn" (printable page) [Law: Luật BVQLNTD Đ.39 k.3, §3.2]. Order history is never truncated [Law: Luật TMĐT Đ.17 k.2].

## Returns

- Request within **15 days** of delivery, also after "Đã nhận được hàng" if still in the window [Policy, §2.4]. Never phrase this as a legal right on the UI; it is the platform's policy [§3.2].
- Reasons: Chưa nhận được hàng · Thiếu hàng · Giao sai hàng · Hàng bể vỡ, lỗi · Khác mô tả · Hàng giả · Đổi ý (only if tags and packaging are intact). No exchanges [Policy].
- Evidence: photos required for every reason except "Chưa nhận được hàng"; up to 5 photos (local mock upload).
- Outcomes: **Hoàn tiền ngay** (no return shipment) or **Trả hàng và hoàn tiền**; the buyer has 6 days to ship the return [Policy].
- What comes back: the refundable amount is the line's share of what was paid. The platform voucher share is returned pro rata; shop and shipping vouchers are not returned [Policy, §2.4]. The confirm step shows this split.
- Statuses and labels: [object-model.md](object-model.md#enums).

## Reviews

- Allowed from `delivered` until 30 days after `completed`, one per line item, editable once until the shop replies [Demo, Q8].
- Stars plus three optional sub-ratings (Chất lượng sản phẩm, Giao hàng, Phục vụ của shop), quick tags, text, up to 5 photos, anonymous toggle.
- Reviews are never hidden or filtered to the positive ones; the default sort is "Mới nhất", not best-first [Law: Luật TMĐT Đ.17 k.2, §3.2].

## Seller and product disclosures

- Shop page and PDP shop card have "Thông tin người bán": business name, business address, tax or business code (fictional), and an "Đã xác thực" badge [Law: Luật TMĐT Đ.17 k.1, Đ.21; Luật BVQLNTD Đ.37]. May sit in a collapsed section [Demo, §7.2].
- PDP has "Thông số" with origin, manufacturer, and mandatory label content, plus a "Chính sách" block (return window, warranty) before purchase [Law: Luật BVQLNTD Đ.37 k.1].
- Site footer links: Về Market (operator details, fictional), Chính sách bảo mật, Quy chế hoạt động, Giải quyết khiếu nại [Law: Luật TMĐT Đ.11 k.1]. These are static pages.
- Legal target: Luật TMĐT 122/2025 (from 01/07/2026) and Luật BVQLNTD 2023 as far as the research could read them. NĐ 248/2026 has not been read in full; no story cites it [Demo, Q1].

## Address

- Two-level administrative units since 01/07/2025: **Tỉnh/Thành phố** (34) → **Phường/Xã/Đặc khu**. The form never asks for Quận/Huyện [Law: NQ 202/2025, Luật 72/2025, §3.5].
- Fields: Họ và tên · Số điện thoại · Tỉnh/Thành phố · Phường/Xã/Đặc khu (filtered by province) · Địa chỉ cụ thể (số nhà, tên đường) · Loại địa chỉ (Nhà riêng/Văn phòng) · Đặt làm mặc định. One line display: detail, ward, province.
- Data: `dvhcvn/20250701` (MIT). Old-address → new-address suggestion is P1.

## Decisions from story writing (2026-11-18)

Gaps the four story writers had to close. Each is a [Demo] decision; stories already follow them.

- **Cards** show the lowest SKU price, no struck-through price, and one label by priority: "Hết hàng" > "Flash sale" > `-NN%` > "Shop chính hãng" > "Freeship". The range rule in #price-display applies on the product page only; a range shows "Giảm đến NN%".
- **Formatting:** compact money and counts round down to one decimal ("Đã bán 1,2tr"); relative time "Vừa xong", "{n} phút trước", "{n} giờ trước". Low stock "Còn {n} sản phẩm" at 10 or fewer.
- **Cart:** new lines start selected; counts are lines, not units; "Tiết kiệm" = Σ(priceBeforePromo − price) × qty + applied shop vouchers; per-shop shipping estimate uses the default address and "Nhanh"; unavailable lines sit in "Sản phẩm không khả dụng" with "Xóa tất cả"; removing always confirms.
- **Best voucher:** pre-applied in the cart (shop) and at checkout (all three slots); largest discount, ties by earliest expiry; a manual choice is kept. A shipping voucher's minSpend uses the same base as the platform voucher. Display name is built by `voucherLabel()`.
- **Voucher buttons by context:** in the hub and on Home, a saved voucher's button becomes "Dùng ngay" (shop voucher → shop page, others → /cart); on the product page and shop page it becomes "Đã lưu" (disabled). Toast "Đã lưu voucher" everywhere. Deep link `/vouchers?voucher={id}` opens the conditions sheet.
- **Buy now** creates a separate checkout session and leaves the cart untouched. Web CTA order: "Mua ngay" black pill, "Thêm vào giỏ" outline pill. The app variant sheet always opens.
- **Place order:** any price, stock, or voucher change found at "Đặt hàng" shows a diff dialog whose only action is "Xem lại đơn hàng". A failed online payment can be retried with the same method until expiry. "Lời nhắn cho Shop" ≤ 200 characters.
- **Cancel:** cancelling one `awaiting_payment` order cancels every order on that Payment. Vouchers on a cancelled order are not returned in P0. COD becomes paid at "Giao thành công".
- **Returns:** whole lines only; the cash refund is the line's paid share; the platform-voucher share comes back as a 30-day Voucher Market credit in Kho voucher; shipping is refunded only when every line is returned; COD refunds go to the seeded bank account; a missed return-shipping deadline ends as "Từ chối" with "Quá hạn gửi hàng trả"; a rejected request puts the order back to its previous status.
- **Orders tabs:** "Đã giao" holds `delivered` and `completed`; return orders appear only in "Trả hàng/Hoàn tiền"; counts only on in-progress tabs. Invoice hidden for `awaiting_payment` and `cancelled`, with a note that it does not replace the seller's VAT invoice.
- **Reviews:** sub-ratings collapsed under "Thêm đánh giá chi tiết"; text optional ≤ 1.000 characters; an order with an open return can still be reviewed; "Mới nhất" is the only sort in P0.
- **Addresses:** at most 10; the default cannot be deleted unless it is the only one; phone 10 digits starting with 0; name ≤ 50, street ≤ 120 characters.
- **Shell:** tab bar only on the five tab routes; sheets do not add history entries; on the app layout the "Dữ liệu mẫu" badge opens demo controls; "Đăng xuất" disabled with "Không dùng trong bản demo"; footer on the app only at the end of Home and in Tôi. Domain state in `localStorage` `market.state.v1`, per-tab drafts in `sessionStorage` `market.session.v1`.
- **Notifications** only for events the buyer did not cause; the buyer's own actions get a toast. Tabs "Đơn hàng", "Ưu đãi", "Hệ thống".
- **Flash sale:** countdown text updated once a minute; "Sắp hết" at ≥ 90% sold; ended slots hidden.
- **Recommendations:** auto-load 3 pages, then "Xem thêm".

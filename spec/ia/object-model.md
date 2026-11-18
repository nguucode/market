# Object model

Business rules are in [rules.md](rules.md). Domain sources are in the vault research note `10-projects/market/research/2026-11-18-vn-marketplace-domain-and-ia.md`. Rules with their sources are in rules.md.

The demo has **one signed-in Buyer** (the persona). Shops, carriers, and payment providers are mock counterparties. Every object is front-end mock state.

## Glossary: code term ↔ UI label

Use these UI labels exactly. Synonyms in the right column are banned in the UI.

| Code term | UI label (vi) | Do not use |
|---|---|---|
| Product | Sản phẩm | Listing, mặt hàng |
| Variant (option dimension) | Phân loại | Biến thể, tùy chọn |
| SKU (one combination) | Phân loại hàng (in cart: "Phân loại: Đen, 11oz") | SKU |
| Shop | Shop | Cửa hàng, gian hàng, người bán |
| Official shop | Shop chính hãng | Mall |
| Cart | Giỏ hàng | Túi hàng |
| Cart line | Sản phẩm trong giỏ | |
| Checkout | Thanh toán (page) | Đặt hàng (page title) |
| Place order | Đặt hàng (button) | Mua ngay (that is the PDP shortcut) |
| Buy now | Mua ngay | |
| Order | Đơn hàng; list page "Đơn mua" | Hóa đơn |
| Shipping option | Phương thức vận chuyển | Gói ship |
| Shipping fee | Phí vận chuyển | Phí ship (except chips: "Freeship") |
| Payment method | Phương thức thanh toán | Hình thức trả tiền |
| Cash on delivery | Thanh toán khi nhận hàng | COD (except compact chips) |
| Voucher | Voucher; hub "Kho voucher" | Mã khuyến mãi, coupon |
| Platform voucher | Voucher Market [name TBD] | Voucher sàn |
| Shop voucher | Voucher của Shop | |
| Shipping voucher | Voucher miễn phí vận chuyển | Mã freeship |
| Flash sale | Flash sale | Giờ vàng |
| Favourite | Yêu thích | Lưu, wishlist |
| Follow (shop) | Theo dõi | Quan tâm |
| Review | Đánh giá | Nhận xét, review |
| Return request | Yêu cầu trả hàng/hoàn tiền | Khiếu nại |
| Refund | Hoàn tiền | Trả tiền lại |
| Confirm received | Đã nhận được hàng | Hoàn tất đơn |
| Address | Địa chỉ nhận hàng | Địa chỉ giao |
| Sold count | Đã bán {n} | Lượt mua |

## Relationships

```
Category 1─* Category                   3 levels; Product belongs to one level-3 category
Shop 1─* Product 1─* VariantDimension    0-2 dimensions (e.g. Màu, Kích cỡ), each with options; option of dim 1 may carry an image
Product 1─* Sku                          one per option combination; price, originalPrice, stock, image?
Product 1─* Review ─1 Sku ─0..1 Order    review is tied to the purchased SKU
Shop 1─* Voucher(scope=shop)             platform and shipping vouchers have no shop
FlashSaleSlot 1─* FlashSaleItem ─1 Sku   slot price + quota override the SKU price inside the slot window
Buyer 1─1 Cart 1─* CartLine ─1 Sku       lines grouped by Shop in the UI, never stored grouped
Buyer 1─* Address                        exactly one default when any exist
Buyer 1─* SavedVoucher ─1 Voucher        claimed (Lưu) vouchers; usage counted per buyer
Buyer 1─* Favorite ─1 Product ; Buyer 1─* Follow ─1 Shop
CheckoutSession → Payment 1─* Order      one Order per Shop; one Payment covers all orders of the session
Order 1─* OrderLine (snapshot of Sku, price, qty) ; Order 1─* TrackingEvent ; Order 1─0..1 ReturnRequest
Order ─* AppliedVoucher                  platform discount is split across orders pro rata (rules.md)
Buyer 1─* Notification                   may link to an Order, ReturnRequest, Voucher, or Product
```

## Objects

| Object | Key fields |
|---|---|
| **Category** | id, slug, name, parentId, level 1-3, image, sortOrder |
| **Shop** | id, handle, name, legalName, businessAddress, businessCode (fictional), `codEnabled`, avatar, banner, `isOfficial`, location (tỉnh/thành), rating, ratingCount, followers, responseRate, responseTime, joinedAt, productCount, shopCategories[] |
| **Product** | id, slug, shopId, categoryId, name, images[] (4:5), video?, description, attributes[] (Thương hiệu, Xuất xứ…), dimensions[], soldCount, rating, ratingCount, `status: active \| delisted`, weightGrams, `freeShipEligible` |
| **Sku** | id, productId, optionIds[], price, priceBeforePromo? (struck-through price, rules.md#price-display), stock, image? |
| **Review** | id, productId, skuId, buyerName (masked when anonymous), rating 1-5, text, tags[], photos[], createdAt, `isMine`, shopReply? |
| **Voucher** | id, code, `scope: platform \| shop \| shipping`, shopId?, `kind: amount \| percent`, value, maxDiscount?, minSpend, startsAt, endsAt, totalQuota, usedCount, perBuyerLimit, `paymentMethods?` (restricts), maxPerShop? (shipping scope) |
| **SavedVoucher** | voucherId, savedAt, usedCount |
| **FlashSaleSlot / Item** | slot: startsAt, endsAt; item: skuId, salePrice, quota, sold, perBuyerLimit |
| **CartLine** | id, skuId, qty, `selected` (new lines start selected), addedAt, priceAtAdd (detects a price change); derived: shop, unit price now, availability |
| **Address** | id, name, phone, provinceCode, wardCode, detail, `label: home \| office`, isDefault. Two-level units (rules.md#address) |
| **Order** | id (`MK` + 12 digits), shopId, lines[], `status`, subtotal, shippingFee, shopDiscount, platformDiscount, shippingDiscount, total, addressSnapshot, shippingOption, paymentMethod, `paymentStatus`, messageToShop, createdAt, timestamps per status, cancelReason?, `cancelledBy?: buyer \| shop \| system`, cancelRequest? (`pending \| refused \| withdrawn`), `refundStatus?` |
| **Payment** | id, orderIds[], method, amount, `status: pending \| paid \| failed \| expired \| refunded`, expiresAt |
| **TrackingEvent** | orderId, at, `code`, text (vi), location? |
| **ReturnRequest** | id, orderId, lineIds[], reason, description, photos[], `solution: refund_only \| return_and_refund`, refundTo, amount (with platform-voucher share), returnDeadline, `status`, timeline[] |
| **Notification** | id, `kind: order \| promotion \| system`, title, body, link, read, createdAt |

## Enums

- **Order.status** (tab in Đơn mua → label on detail):
  - `awaiting_payment` → "Chờ thanh toán" (online payment not completed; auto-cancels at Payment.expiresAt)
  - `to_confirm` → "Chờ xác nhận" (tab "Chờ lấy hàng")
  - `to_ship` → "Chờ lấy hàng"
  - `shipping` → "Đang giao"
  - `delivered` → "Đã giao" (return window open; tab "Đã giao")
  - `completed` → "Hoàn thành" (buyer confirmed or window elapsed; review allowed)
  - `cancelled` → "Đã hủy"
  - `return_requested` / `returned` → see ReturnRequest.status (tab "Trả hàng/Hoàn tiền")
- **Payment method**: `cod` "Thanh toán khi nhận hàng", `wallet` "Ví điện tử" (mock providers, text only), `vietqr` "Chuyển khoản ngân hàng (VietQR)", `card` "Thẻ tín dụng/ghi nợ", `installment` P1. Order of options and COD rules: rules.md#payment.
- **Shipping option**: `express` "Hỏa tốc" (same-city only), `fast` "Nhanh", `economy` "Tiết kiệm". Carriers are fictional names.
- **ReturnRequest.status**: `submitted` "Đã gửi yêu cầu", `under_review` "Market đang xem xét", `needs_evidence` "Cần bổ sung bằng chứng", `awaiting_return_shipment` "Chờ gửi hàng trả", `returning` "Đang trả hàng", `inspecting` "Đang kiểm tra", `refunded` "Đã hoàn tiền", `rejected` "Từ chối". `refund_only` skips the three shipping states.

## Order state machine

```
awaiting_payment ──paid──▶ to_confirm ──shop confirms──▶ to_ship ──carrier picks up──▶ shipping ──delivered──▶ delivered ──confirm / window──▶ completed
       │                      │                            │                            │                         │
       └─expired─▶ cancelled  └─buyer cancels─▶ cancelled  └─buyer requests cancel,     └─failed delivery ×N ─▶   └─return request─▶ return_requested
                                                              shop accepts─▶ cancelled      cancelled (COD)
```

Every transition is fired by the mock store, and from the reviewer's side by Demo controls ("Shop xác nhận", "Giao cho vận chuyển", "Giao thành công", "Giao thất bại", "Hết hạn thanh toán").

---
id: US-PDP-007
title: Product details and attributes
epic: PDP
priority: P0
status: Draft
size: S
routes: ["/p/:slug"]
dependsOn: [US-PDP-001]
---

## Story

As a buyer, I want the product's specs, description, and the return and warranty terms on the product page, so that I know exactly what I am buying and what happens if it goes wrong.

## Acceptance criteria

- Given the product page, then a "Thông số" block lists, as label/value rows: "Danh mục" (the category path as links), then the product `attributes` in seed order, always including "Thương hiệu", "Xuất xứ", and "Nhà sản xuất", plus any mandatory label content the category carries (e.g. "Chất liệu", "Hạn sử dụng"), and finally "Gửi từ" (the shop's province or "Nước ngoài") (rules.md#seller-and-product-disclosures).
- Given the product page, then a "Mô tả sản phẩm" block shows the description with paragraph breaks kept; if longer than 10 lines it is clamped with "Xem thêm", which toggles to "Thu gọn".
- Given the product page, then a "Chính sách" block, placed before the shop card on web and before the actions are reached on app, shows "Trả hàng/Hoàn tiền trong 15 ngày" (rules.md#returns, worded as the platform's policy, never as a legal right) and "Bảo hành" with the product's warranty attribute or "Không bảo hành".
- Given the "Chính sách" block, then "Xem chi tiết" links to the policy page `/policies/quy-che`.
- Given an attribute value is empty in the data, then the row is hidden, except "Xuất xứ" and "Nhà sản xuất", which the mock seed test requires on every active product.

## UI states

- Empty: a product with no extra attributes shows only Danh mục, Thương hiệu, Xuất xứ, Nhà sản xuất, Gửi từ.
- Loading: rows render with the product; no own loading.
- Error: none beyond the page.
- Unavailable: delisted → the blocks still render (useful for a buyer who bought it before).
- Overflow: a 300-word description clamps; a long attribute value ("Thép không gỉ 304, nhựa PP không chứa BPA, silicone thực phẩm") wraps under its label on app and beside it on web; 15 attributes render without a nested scroll.

## Design notes

- Web (≥ 1024): "Chính sách" sits in the right column under the actions as two short trust lines with icons (the reference study's "returns accepted" line). "Thông số" and "Mô tả sản phẩm" are full-width sections below, specs as a two-column label/value table (labels muted 30%), headings serif 20px.
- App (< 1024): "Chính sách" is a row of two trust lines right after the shipping row; "Thông số" and "Mô tả sản phẩm" are collapsible sections (open by default for "Thông số" first 5 rows with "Xem thêm"), research §7.2 collapsed-section pattern.
- No tables with borders; hairline row separators only.

## FE notes

- `ProductSpecs`, `ProductDescription`, `ProductPolicies` components.
- Pure, TDD: `specRows(product, categoryPath, shop)` → ordered rows with the required ones guaranteed; `clampLines` is CSS (`line-clamp`) with a measured toggle, not JS truncation.
- Description is plain text with `\n`; render paragraphs, never HTML from data.
- The mock seed test asserts "Xuất xứ" and "Nhà sản xuất" on every active product.

## Mock data

- Attributes per category family (Đồ bếp: Chất liệu, Dung tích; Sắc đẹp: Hạn sử dụng, Thành phần; Điện thoại & Phụ kiện: Bảo hành).
- One product with a 300-word description and 15 attributes; one with the minimum set.

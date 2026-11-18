---
id: US-CHK-002
title: Choose or add the delivery address
epic: CHK
priority: P0
status: Draft
size: M
routes: ["/checkout"]
dependsOn: [US-CHK-001, US-ACC-003, US-FND-008]
---

## Story

As a buyer, I want to see where my order goes and switch to another saved address or add a new one without leaving checkout, so that I can send a gift to my mother in Hà Nội in the same flow.

## Acceptance criteria

- Given I have a default address, when checkout loads, then the top block "Địa chỉ nhận hàng" shows "{Họ và tên} | {0905 123 456}", the one-line address "{Địa chỉ cụ thể}, {Phường/Xã}, {Tỉnh/Thành phố}" (rules.md#address), the tag "Mặc định" and the label "Nhà riêng" or "Văn phòng", and a "Thay đổi" action.
- When I press "Thay đổi", then the address sheet (app) or side panel (web) lists all my addresses with radios, the current one selected, each with "Sửa", and a button "Thêm địa chỉ mới".
- Given I pick another address and press "Xác nhận", then checkout uses it for this session only (my default does not change), and every shop's shipping fee, delivery estimate, and option availability are recomputed (US-CHK-003).
- When I press "Thêm địa chỉ mới" or "Sửa", then the address form from US-ACC-003 opens over the sheet; on "Hoàn thành" the new or edited address is saved to my address book and selected for this checkout.
- Given the new address is in another province and a shop block had "Hỏa tốc", then that block falls back to "Nhanh" with the inline note "Hỏa tốc chỉ áp dụng khi Shop và địa chỉ nhận cùng tỉnh. Đã chuyển sang Nhanh." (rules.md#shipping).
- Given I have no address, then the block reads "Thêm địa chỉ nhận hàng" and opens the form directly; "Đặt hàng" is disabled with the helper "Vui lòng thêm địa chỉ nhận hàng".

## UI states

- Empty: no saved address → form opens from the block; the first address saved becomes default (US-ACC-003).
- Loading: the block shows a two-line skeleton; the sheet lists from the store with no extra wait.
- Error: saving the form fails → the form stays open with "Không lưu được địa chỉ. Thử lại." (US-ACC-003); the previous address stays selected.
- Unavailable: none in P0 (every province is deliverable).
- Overflow: a 120-character "Địa chỉ cụ thể" wraps to three lines in the block and two lines in the sheet rows; 10 addresses scroll in the sheet with "Thêm địa chỉ mới" sticky at the bottom.

## Design notes

- Web (≥ 1024): address block spans the left column with a thin top rule; "Thay đổi" is a text link on the right. The list opens as a 480px side panel; the form replaces the panel content with a back arrow.
- App (< 1024): block is a full-width row with a location icon and chevron; the list opens as a bottom sheet at 80% height; the form opens as a full-height sheet stacked on top.

## FE notes

- Component `CheckoutAddressBlock`, `AddressPickerSheet`; reuses `AddressForm` from US-ACC-003 unchanged.
- `checkout.session.addressId` changes trigger `priceCheckout` again; the Hỏa tốc fallback is a pure rule `normalizeShippingOption(option, shop, address)` (TDD) used by US-CHK-003 too.
- `formatAddressLine(address, units)` comes from US-ACC-003.

## Mock data

- Persona addresses: Nhà (default, Đà Nẵng) and Văn phòng (Đà Nẵng); the demo adds a Hà Nội address for her mother here.
- A seeded shop in Đà Nẵng with "Hỏa tốc" selected, so switching to Hà Nội shows the fallback note.

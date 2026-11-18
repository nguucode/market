---
id: US-ACC-002
title: Address list and default address
epic: ACC
priority: P0
status: Draft
size: S
routes: ["/me/addresses"]
dependsOn: [US-ACC-001, US-ACC-003]
---

## Story

As a buyer, I want to see all my delivery addresses, pick my default, and delete ones I no longer use, so that checkout starts with the right address.

## Acceptance criteria

- Given I open `/me/addresses`, then the title is "Địa chỉ của tôi" and each address shows "{Họ và tên} | {0905 123 456}", the one-line address (rules.md#address), the label "Nhà riêng" or "Văn phòng", and "Mặc định" on the default one, which is listed first; the rest follow newest first.
- Given a non-default address, when I press "Thiết lập mặc định", then it becomes the only default (exactly one default when any exist, object-model.md) and moves to the top, with the toast "Đã cập nhật địa chỉ mặc định".
- When I press "Sửa" or "Thêm địa chỉ mới", then the address form (US-ACC-003) opens; saving returns to the list with the change visible.
- Given a non-default address, when I press "Xóa", then the confirm dialog (US-FND-010) asks "Xóa địa chỉ này?" and on "Xóa" removes it with the toast "Đã xóa địa chỉ".
- Given the default address, then "Xóa" is disabled with the helper "Không thể xóa địa chỉ mặc định. Hãy chọn địa chỉ khác làm mặc định trước." unless it is the only address, in which case it can be deleted and the list becomes empty.
- Given I already have 10 addresses, then "Thêm địa chỉ mới" is disabled with "Bạn đã có tối đa 10 địa chỉ".
- Given past orders, then deleting or editing an address never changes them (orders keep their `addressSnapshot`).

## UI states

- Empty: "Bạn chưa có địa chỉ nào" with the black pill "Thêm địa chỉ mới".
- Loading: three address-row skeletons.
- Error: a failed delete or default change reverts with "Không cập nhật được địa chỉ. Thử lại.".
- Unavailable: none.
- Overflow: a 120-character "Địa chỉ cụ thể" wraps to three lines; a 50-character name truncates before the phone; 10 addresses scroll.

## Design notes

- Web (≥ 1024): account nav on the left (US-ACC-001); list as plain rows separated by hairlines; actions "Sửa", "Xóa" as text links on the right, "Thiết lập mặc định" as an outline pill; "Thêm địa chỉ mới" black pill top right. The form opens as a 520px side panel.
- App (< 1024): back + "Địa chỉ của tôi" header; tapping a row opens the form; "Thiết lập mặc định" and "Xóa" are inside the form footer; "Thêm địa chỉ mới" is a sticky full-width black pill at the bottom.

## FE notes

- Route `/me/addresses`, page `AddressesPage`, overlay `address-form` (sitemap.yaml).
- Store actions `addresses.setDefault(id)`, `addresses.remove(id)`, both enforcing the single-default invariant in the store.
- Pure function, TDD: `sortAddresses(addresses)` and `canDeleteAddress(address, all)` → `{ ok } | { ok: false, reason }`.

## Mock data

- Persona addresses Nhà (default, Đà Nẵng) and Văn phòng (Đà Nẵng); one address with the 120-character detail line for overflow.

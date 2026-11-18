---
id: US-ACC-003
title: Add and edit an address
epic: ACC
priority: P0
status: Draft
size: M
routes: ["/me/addresses", "/checkout"]
dependsOn: [US-FND-008, US-FND-003]
---

## Story

As a buyer, I want an address form that matches today's two-level administrative units, so that I enter my province and ward once and never get asked for a district that no longer exists.

## Acceptance criteria

- Given I open the form ("Thêm địa chỉ mới" or "Sửa"), then it has exactly the fields of rules.md#address in this order: "Họ và tên", "Số điện thoại", "Tỉnh/Thành phố", "Phường/Xã/Đặc khu", "Địa chỉ cụ thể" (placeholder "Số nhà, tên đường"), "Loại địa chỉ" with "Nhà riêng" / "Văn phòng", and the switch "Đặt làm mặc định"; there is no "Quận/Huyện" field anywhere.
- Given "Tỉnh/Thành phố", then it opens a searchable list of the 34 provinces; search ignores diacritics and case ("da nang" matches "Đà Nẵng").
- Given a province is chosen, then "Phường/Xã/Đặc khu" is enabled and lists only that province's units, searchable the same way; changing the province clears the ward.
- When I press "Hoàn thành" with a field invalid, then each invalid field shows its message: "Vui lòng nhập họ và tên", "Số điện thoại không hợp lệ" (10 digits starting with 0), "Vui lòng chọn Tỉnh/Thành phố", "Vui lòng chọn Phường/Xã/Đặc khu", "Vui lòng nhập địa chỉ cụ thể"; focus moves to the first invalid field.
- Given a valid form, when I press "Hoàn thành", then the address is saved, the toast "Đã lưu địa chỉ" shows, and the caller (US-ACC-002 or US-CHK-002) receives the saved address id.
- Given it is my first address, then "Đặt làm mặc định" is on and locked; given I switch it on for another address, then the previous default loses it on save.
- Given I edit an address used by past orders, then those orders keep their snapshot; given I close the form with changes, then the confirm "Bỏ thay đổi?" asks before discarding.

## UI states

- Empty: new form, ward disabled with the helper "Chọn Tỉnh/Thành phố trước".
- Loading: province and ward lists load from the bundled dataset with no network wait; "Hoàn thành" shows a spinner during the mock save.
- Error: save fails → "Không lưu được địa chỉ. Thử lại." above the button; inputs keep their values.
- Unavailable: none.
- Overflow: "Họ và tên" max 50 characters, "Địa chỉ cụ thể" max 120 with a counter; long ward names ("Phường Hòa Khánh Bắc" style and longer) wrap in the list rows and truncate in the closed field; the phone field formats as `0905 123 456` while typing.

## Design notes

- Web (≥ 1024): 520px side panel (US-FND-008) with the fields in one column, 48px inputs with 8px radius; province and ward open as searchable dropdowns inside the panel; "Hoàn thành" black pill and "Trở lại" outline pill at the bottom.
- App (< 1024): full-height sheet with header "Địa chỉ mới" or "Sửa địa chỉ"; province and ward open a stacked full-height list with a search field pinned on top; phone uses `inputmode="tel"`; "Hoàn thành" sticky full-width black pill.
- Labels above fields, errors under them in ink with an icon, not red-only, so the message is not colour-dependent.

## FE notes

- Component `AddressForm` (props: `initial?`, `onSaved(id)`, `onCancel`), used by `/me/addresses` and the checkout `address-form` overlay; `UnitPicker` for province and ward.
- Data: `dvhcvn/20250701` (MIT) trimmed at build time to `src/mock/data/units.json` (34 provinces with their wards: code, name, type); licence noted in the repo.
- Pure functions, TDD: `validateAddress(input)` → field errors; `normalizeVi(text)` for search (NFD, strip combining marks, "đ" → "d"); `formatAddressLine(address, units)` → "{detail}, {ward}, {province}" (rules.md#address); `isValidVnPhone(digits)`.
- Store action `addresses.save(input)` enforces the single default.
- Enhanced by ACC P1: Old → new address suggestion.

## Mock data

- Full 34-province, two-level unit list from `dvhcvn/20250701`.
- Persona addresses in Đà Nẵng; the demo adds a Hà Nội address for her mother.

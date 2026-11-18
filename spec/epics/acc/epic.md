---
code: ACC
name: Me
route: /me
summary: The Me page and account menu, the address book with a default address, the two-level address form shared with checkout, and favourite products.
---

# ACC · Me

"Tôi" is the persona's home base: order shortcuts, saved vouchers, favourites, followed shops, and addresses. Its most load-bearing piece is the address form, which follows the two-level administrative units in force since 01/07/2025 (Tỉnh/Thành phố → Phường/Xã/Đặc khu, no Quận/Huyện; rules.md#address) and is reused unchanged by checkout (US-CHK-002). The demo has one signed-in persona, so there is no sign-in, sign-up, or profile editing in P0.

## P0 stories

- US-ACC-001 — Me page and account menu
- US-ACC-002 — Address list and default address
- US-ACC-003 — Add and edit an address
- US-ACC-004 — Favourite products

## P1 backlog

| Title | Why P1 |
|---|---|
| Old → new address suggestion ("Địa chỉ mới của bạn có thể là…") | rules.md#address marks it P1; needs the dvhcvn split/merge mapping and a one-to-many picker. |
| Followed shops tab on `/favorites` | sitemap.yaml marks the Shops tab P1; P0 shows followed shops as a row on Me. |
| Xu balance and history on Me | Xu is P1 (rules.md#voucher-math item 8). |
| Edit profile (name, avatar, phone) | One fixed persona; nothing in the demo loop changes it. |
| My reviews page (`/me/reviews`) | Marked P1 in sitemap.yaml. |
| Pick address on a map or from device location | Text fields cover the law and the demo; geolocation adds permission states. |
| Favourite collections | The demo needs one flat list. |

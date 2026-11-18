---
id: US-FND-011
title: Legal footer and policy pages
epic: FND
priority: P0
status: Draft
size: S
routes: ["/", "/policies/:slug", "/me"]
dependsOn: [US-FND-001]
---

## Story

As a buyer, I want to find who runs Market, how my data is handled, the operating rules and how to complain, from any page, so that I know who I am buying through before I pay.

## Acceptance criteria

- Given the web layout on any page with the normal shell, then the footer shows the links "Về Market", "Chính sách bảo mật", "Quy chế hoạt động", "Giải quyết khiếu nại" (rules.md#seller-and-product-disclosures) and "Điều khoản sử dụng", plus the operator block with the fictional company name, business address and business code, and the line "Bản demo dùng dữ liệu mẫu. Không có giao dịch thật."
- Given the app layout, then the same links and operator block appear at the end of `/` (after the recommendations) and as a "Thông tin Market" group in the help section of `/me`; no footer on other app screens.
- Given `shell: focused` or `shell: none`, then no footer renders (checkout keeps only the terms line from rules.md#checkout-disclosures, owned by CHK).
- Given I open a link, then `/policies/:slug` renders the static page for `ve-market`, `bao-mat`, `quy-che`, `khieu-nai` or `dieu-khoan` with its serif title ("Về Market", "Chính sách bảo mật", "Quy chế hoạt động", "Giải quyết khiếu nại", "Điều khoản sử dụng"), the line "Cập nhật ngày 18/11/2026" and the body; an unknown slug shows the not-found page with "Trang không tồn tại." (US-FND-006).
- Given "Về Market", then it lists the operator's fictional legal name, address, business code, email and a fictional hotline formatted by US-FND-002, each labelled; given "Giải quyết khiếu nại", then it describes the return request route ("Yêu cầu trả hàng/hoàn tiền" from "Đơn mua") without calling it a legal right (rules.md#returns).

## UI states

- Empty: not applicable; content is static.
- Loading: none (bundled Markdown).
- Error: unknown slug → US-FND-006.
- Unavailable: none.
- Overflow: policy pages are long; on web a sticky in-page table of contents appears at ≥ 1280px; on app headings act as anchors. Long Vietnamese legal names wrap, never truncate.

## Design notes

- Web (≥ 1024): footer on a slightly darker paper band, four columns of 14px links, operator block in 12px at 70% ink, a hairline above. Policy page: reading column max-width 680, serif h1 32px, h2 22px, body 16px/1.6.
- App (< 1024): footer as a stacked list of 48px link rows at the end of Home; policy page with back + title header, body 16px, 16px margins.

## FE notes

- `src/content/policies/*.md` rendered with the project's Markdown component; slugs list `POLICY_SLUGS` drives both footer and router. A test asserts every footer link resolves to an existing slug.
- `Footer.tsx` hidden by `resolveScreen().shell !== 'normal'` (US-FND-001).
- The operator details are a single constant `OPERATOR` reused by "Về Market" and the printable invoice (US-ORD-007).

## Mock data

- Fictional operator: legal name, address in Đà Nẵng, a fictional business code, email on a reserved example domain. No real company names.

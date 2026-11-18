---
id: US-ORD-007
title: Printable order invoice
epic: ORD
priority: P0
status: Draft
size: S
routes: ["/orders/:id", "/orders/:id/invoice"]
dependsOn: [US-ORD-002, US-FND-002]
---

## Story

As a buyer, I want to download or print a document for my order with the seller, the items, and every amount, so that I can keep a record or claim the expense.

## Acceptance criteria

- Given an order that is not `awaiting_payment` and not `cancelled`, then the details block on the order detail shows "Tải hóa đơn" (rules.md#order-rules), which opens `/orders/:id/invoice` in a new tab; for `awaiting_payment` and `cancelled` orders the row is absent.
- Given I open `/orders/:id/invoice`, then the page has no app shell (sitemap.yaml `shell: none`) and shows: title "Hóa đơn", "Mã đơn hàng", "Ngày đặt hàng", the seller block "Người bán" (shop `legalName`, `businessAddress`, "Mã số doanh nghiệp" `businessCode`), the buyer block "Người mua" (address snapshot name, phone, address), and the payment method.
- Given the items table, then it has columns "Sản phẩm", "Phân loại", "Số lượng", "Đơn giá", "Thành tiền" with the snapshot values, followed by the same rows as "Chi tiết thanh toán" on the detail (each voucher by name), "Tổng thanh toán", and "Giá đã bao gồm VAT".
- Given the page, then a footer note says "Chứng từ này do Market tạo từ thông tin đơn hàng, không thay thế hóa đơn giá trị gia tăng của người bán.", and every page shows the "Dữ liệu mẫu" badge (rules.md#spec-conventions).
- Given I tap "In / Lưu PDF", then the browser print dialog opens (`window.print()`); the button and the badge's interactive parts are hidden in print, and the layout fits A4 portrait.
- Given a delivered order with a later return refunded, then the invoice still shows the original order; the refund is not netted in.

## UI states

- Empty: unknown `:id`, or an order not eligible → the not-found page (US-FND-006).
- Loading: a plain skeleton of the table; no shell.
- Error: "Không tải được hóa đơn." with "Thử lại".
- Unavailable: `awaiting_payment` and `cancelled` as above.
- Overflow: a 5-line order with the 120-character name wraps inside the "Sản phẩm" column; the table never splits a row across print pages (`break-inside: avoid`); the `112.499.000₫` total fits the amount column at A4 width and at 375 px (table scrolls horizontally inside its own box on small screens, page does not).

## Design notes

- Web (≥ 1024): centred paper sheet max-width 794 (A4 at 96 dpi) on the paper background, serif title, one ink colour, tabular numerals right-aligned.
- App (< 1024): same sheet full width with 16 px gutters; "In / Lưu PDF" as a full-width pill at the top.
- Print: white background, no shadows, black text, URL and date of printing in the footer.

## FE notes

- Route `/orders/:id/invoice`; `InvoicePage` reuses `PaymentBreakdown` from US-ORD-002 with a print variant; `@media print` styles only, no PDF library.
- Pure function to TDD: `invoiceAvailable(order)`; line `Thành tiền = price × qty` from the snapshot.

## Mock data

- The Shop A worked-example order (415.677₫); the 5-line order; the order with the largest total; shops carry fictional legal name, address, and business code (ia/mock-data.md).

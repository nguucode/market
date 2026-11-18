---
id: US-RET-002
title: Return request status
epic: RET
priority: P0
status: Draft
size: M
routes: ["/returns/:id", "/orders", "/orders/:id"]
dependsOn: [US-RET-001, US-FND-004]
---

## Story

As a buyer with an open return request, I want one page that says where my request stands, what I must do next and by when, and how much comes back, so that I never miss the return-shipping deadline or wonder whether I was refunded.

## Acceptance criteria

- Given I open `/returns/:id`, then the title is "Chi tiết trả hàng" and a status block shows the current label from object-model.md#enums ("Đã gửi yêu cầu", "Market đang xem xét", "Cần bổ sung bằng chứng", "Chờ gửi hàng trả", "Đang trả hàng", "Đang kiểm tra", "Đã hoàn tiền", "Từ chối") with one sentence saying what happens next and who acts.
- Given the status timeline, then every reached status is listed newest first with its time, and the steps still ahead are shown muted in order; a `refund_only` request never shows "Chờ gửi hàng trả", "Đang trả hàng", or "Đang kiểm tra"; "Cần bổ sung bằng chứng" appears only if it happened.
- Given the Demo control "ask for evidence", then the status is "Cần bổ sung bằng chứng" with the reviewer's note and a photo picker ("Thêm ảnh (0/5)", counting existing photos toward 5); "Gửi bổ sung" adds the photos and moves the request back to "Market đang xem xét".
- Given the Demo control "approve return", then the status is "Chờ gửi hàng trả", `returnDeadline` is set 6 days ahead (rules.md#returns), and the page shows "Gửi hàng trước 24/11/2026 · còn 6 ngày", the shop's return address, and a "Mã vận đơn" field with "Xác nhận đã gửi hàng" (required, 8–20 letters or digits); confirming moves it to "Đang trả hàng". On the last day the line reads "Hạn gửi hàng hôm nay".
- Given the return deadline passes without a tracking code (Demo control clock jump), then the request becomes "Từ chối" with "Lý do: Quá hạn gửi hàng trả" and the order returns to its previous status.
- Given the Demo control "approve refund only", or inspection passes after "Đang kiểm tra", then the status is "Đã hoàn tiền" with "Đã hoàn 156.531₫ về tài khoản ngân hàng đã thanh toán · 19/11/2026" and "Đã hoàn Voucher Market 12.172₫ vào Kho voucher", using the amounts stored on the request (US-RET-001); the order becomes `returned`.
- Given the Demo control "reject", then the status is "Từ chối" with the reason (e.g. "Ảnh chưa thể hiện lỗi sản phẩm") and the order returns to `delivered` or `completed` as before; the order shows no new "Trả hàng/Hoàn tiền" action, since the request is one per order.
- Given the summary block, then it repeats the lines, reason, photos, solution, and the refund split from the confirm step, plus "Mã yêu cầu" with "Sao chép" and a link "Xem đơn hàng" to `/orders/:id`; the order card in the "Trả hàng/Hoàn tiền" tab and the order detail both link here with "Xem chi tiết trả hàng".

## UI states

- Empty: unknown `:id` → not-found page (US-FND-006).
- Loading: status block, timeline, and summary skeletons.
- Error: "Không tải được yêu cầu." with "Thử lại"; "Gửi bổ sung" or "Xác nhận đã gửi hàng" fail → inline "Không gửi được. Vui lòng thử lại." with the input kept.
- Unavailable: the tracking-code field and the evidence picker appear only in their status; after "Đã hoàn tiền" or "Từ chối" the page is read-only.
- Overflow: the rejection reason up to 300 characters wraps; the shop's return address with a 40-character shop name wraps to 3 lines; 5 + 5 photos in the summary show as a 5-per-row grid with "+5"; the countdown never changes width.

## Design notes

- Web (≥ 1024): two columns in max-width 1120: left status block, the action panel for the current step (evidence picker or return-shipping box), and the timeline; right (360, sticky) summary with the refund split.
- App (< 1024): single column, header back + "Chi tiết trả hàng"; status band, then the action panel, then the timeline, then the summary; the step's primary button pinned at the bottom only while the buyer has something to do.
- The deadline line uses ink bold, and the deal colour only on the last 2 days; "Từ chối" in ink with a plain reason, never red; "Đã hoàn tiền" gets a check icon and the amount at 24 px.

## FE notes

- Route `/returns/:id`; `ReturnPage` with `ReturnStatusBlock`, `ReturnTimeline`, `EvidencePanel` (reuses `PhotoPicker`), `ReturnShippingPanel`, `ReturnSummary` (reuses the split rows from US-RET-001).
- Pure functions to TDD:
  - `returnTimeline(request)` → reached steps with times plus the ordered pending steps; skips the three shipping statuses for `refund_only`.
  - `returnTransition(request, event, now)` for `submit`, `review`, `askEvidence`, `addEvidence`, `approveRefundOnly`, `approveReturn`, `markShipped(code)`, `receive`, `passInspection`, `reject(reason)`, `expireDeadline`; illegal events throw. `approveRefundOnly` on a `return_and_refund` request switches the solution (Market decides the outcome).
  - `deadlineCopy(returnDeadline, now)` → "còn 5 ngày" / "Hạn gửi hàng hôm nay" / expired.
  - `orderStatusAfterReturn(order, request)` → `returned`, or the status before `return_requested`.
- Demo controls (US-FND-004): approve refund only, approve return, ask for evidence, reject, advance return shipping and inspection, clock jump.

## Mock data

- The seeded "return request awaiting the shop" from ia/mock-data.md at "Market đang xem xét"; one at "Chờ gửi hàng trả" with 1 day left; one `refund_only` at "Đã hoàn tiền"; one "Từ chối" with a reason.
- Shop return addresses on the 40 shops (fictional).

---
id: US-RET-001
title: Request a return or refund
epic: RET
priority: P0
status: Draft
size: M
routes: ["/orders/:id", "/orders/:id/return"]
dependsOn: [US-ORD-002, US-FND-010]
---

## Story

As a buyer who got the wrong, broken, or missing item, I want to ask for my money back in a few short steps and see before I send exactly how much comes back and where, so that I trust the outcome before Market reviews it.

## Acceptance criteria

- Given an order in `delivered` or `completed` with no ReturnRequest and today within the window from `deliveredAt` (rules.md#returns), then the detail shows "Trả hàng/Hoàn tiền" with the line "Hạn yêu cầu: 03/12/2026"; after the window the action is gone and the details block says "Đã hết hạn yêu cầu trả hàng/hoàn tiền (03/12/2026)."; the copy never calls the window a legal right.
- Given I open `/orders/:id/return`, then the title is "Yêu cầu trả hàng/hoàn tiền", a step indicator shows the steps from sitemap.yaml as "Sản phẩm", "Lý do", "Bằng chứng", "Hoàn tiền", "Xác nhận" (`?step=items|reason|evidence|refund|confirm`), and step "Sản phẩm" lists every line with a checkbox (all unchecked; a single-line order is pre-checked); "Tiếp tục" is disabled until one line is checked.
- Given step "Lý do", then I pick exactly one of "Chưa nhận được hàng", "Thiếu hàng", "Giao sai hàng", "Hàng bể vỡ, lỗi", "Khác mô tả", "Hàng giả", "Đổi ý" (rules.md#returns), and may add "Mô tả chi tiết" (max 500 characters); "Đổi ý" also requires ticking "Sản phẩm còn nguyên tem, nhãn và bao bì" and shows "Market không hỗ trợ đổi hàng, chỉ hoàn tiền."
- Given step "Bằng chứng", then I add 1 to 5 photos ("Thêm ảnh (2/5)", local mock upload, each removable); "Tiếp tục" without a photo shows "Vui lòng thêm ít nhất 1 ảnh."; for "Chưa nhận được hàng" the step is skipped and the indicator marks it "Không cần".
- Given step "Hoàn tiền", then I choose "Hoàn tiền ngay" ("Không cần gửi trả hàng") or "Trả hàng và hoàn tiền" ("Bạn gửi trả hàng trong 6 ngày sau khi được chấp nhận", rules.md#returns); for "Chưa nhận được hàng" only "Hoàn tiền ngay" is offered. Below, "Hoàn tiền về" shows the destination from the paid method: VietQR or wallet "Nguồn thanh toán ban đầu · trong vòng 24 giờ sau khi hoàn tiền", card "Thẻ đã thanh toán · 7–14 ngày làm việc", COD "Tài khoản ngân hàng ••••6789 · trong vòng 24 giờ" (rules.md#order-rules).
- Given step "Xác nhận", then a summary lists the lines, reason, photo thumbnails, solution, destination, and the block "Số tiền hoàn" with the split: "Tiền hàng 180.000₫", "Voucher của Shop (không hoàn) −11.297₫", "Voucher Market đã dùng −12.172₫", "Hoàn tiền về tài khoản 156.531₫", and "Hoàn vào Kho voucher: Voucher Market 12.172₫"; the shipping row reads "Phí vận chuyển (không hoàn)" unless every line is returned (rules.md#returns).
- Given I tap "Gửi yêu cầu", then a ReturnRequest is created with status `submitted` and its first timeline entry, the order moves to `return_requested` (tab "Trả hàng/Hoàn tiền"), and `?step=result` shows "Đã gửi yêu cầu trả hàng/hoàn tiền", "Market sẽ phản hồi trong 3–5 ngày làm việc.", the request id, and "Xem chi tiết" to `/returns/:id`.
- Given I go back from any step, then my choices are kept; given I reload mid-flow, then the flow restarts at "Sản phẩm" (photos are not persisted), and given the order already has a ReturnRequest, then `/orders/:id/return` redirects to `/returns/:id`.

## UI states

- Empty: none; an order with no eligible lines never shows the entry.
- Loading: "Gửi yêu cầu" shows a spinner; photo thumbnails show a progress shimmer while the mock upload resolves.
- Error: send fails → "Không gửi được yêu cầu. Vui lòng thử lại." with all steps kept; a photo over 10 MB or not an image → "Ảnh không hợp lệ (tối đa 10 MB, định dạng JPG, PNG, HEIC)."
- Unavailable: window passed while the flow was open → the confirm step shows "Đã hết hạn yêu cầu trả hàng/hoàn tiền." and disables "Gửi yêu cầu"; an order in another status → redirect to `/orders/:id`.
- Overflow: 5 lines with the 120-character name clamp to 2 lines each with the checkbox aligned to the first; "Hàng bể vỡ, lỗi" and "Khác mô tả" fit one line at 375 px; a 500-character description wraps in the summary with "Xem thêm"; the split block with `12.499.000₫` stays right-aligned.

## Design notes

- Web (≥ 1024): flow page in a centred column (max-width 640) with the step indicator as a text row ("1 Sản phẩm · 2 Lý do · …"), the order's shop and id as a small header, "Quay lại" text button and "Tiếp tục" black pill at the bottom of each step; the confirm step's split sits in a hairline-bordered block.
- App (< 1024): full screen, header back + "Yêu cầu trả hàng/hoàn tiền", tab bar hidden, compact step indicator ("Bước 2/5 · Lý do"), reasons as 56 px radio rows, "Tiếp tục" pinned at the bottom above the safe area; photo grid 3 per row with the add tile first.
- Solution choice as two large selectable cards with one sentence each; the "không hoàn" rows in muted ink, the amounts that come back in ink bold. No red anywhere; this is a service flow, not a dispute.

## FE notes

- Route `/orders/:id/return?step=`; `ReturnFlow` with `ReturnItemsStep`, `ReturnReasonStep`, `EvidenceStep` (`PhotoPicker`, shared with US-REV-001, whichever lands first builds it; object URLs held in memory), `RefundStep`, `ReturnConfirmStep`, `ReturnResult`. Draft in the session store keyed by order id.
- Pure functions to TDD:
  - `canRequestReturn(order, returnRequest, now)` → `{ ok, deadline, reason? }` (status, window from `deliveredAt`, one request per order).
  - `returnSplit(order, lineIds)` → `{ goods, shopVoucherShare, platformVoucherShare, shippingRefund, cash, voucherBack }`: each order-level discount is split across all lines pro rata to line goods with largest remainder (same helper as rules.md#voucher-math item 5), so the shares of all lines sum exactly to the order discount; `cash = goods − shopShare − platformShare + shippingRefund`, `voucherBack = platformShare`; `shippingRefund = total shipping paid` only when every line is selected, else 0. Test: Shop A order, return the 180.000₫ line → shop share 11.297, platform share 12.172, cash 156.531; returning both lines → cash 415.677 (the order total).
  - `allowedSolutions(reason)`, `evidenceRequired(reason)`, `refundDestination(paymentMethod)`.
- Store action `returns.create(draft)` sets `order.status = return_requested`; Demo controls take over from there (US-RET-002).
- Enhanced by RET P1: Return part of a line's quantity.

## Mock data

- The Shop A worked-example order delivered 3 days ago (VietQR, 2 lines) for the split; a COD order delivered 14 days ago (last window day); a completed order delivered 20 days ago (window passed); a single-line card order.
- Seeded persona bank account "Tài khoản ngân hàng ••••6789" for COD refunds.
- 3 sample photos in `src/mock/data/` so reviewers can pick without a camera.

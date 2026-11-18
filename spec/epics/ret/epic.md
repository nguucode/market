---
code: RET
name: Returns
route: /returns/:id
summary: Return and refund request flow from a delivered order (items, reason, evidence, solution, confirm with the refund split, result) and the return request status page with its timeline and return-shipping deadline.
---

# RET · Returns

A return request is the buyer's one way back after delivery. It opens from the order detail while the 15-day window in rules.md#returns is open, covers whole lines of one order, and always shows before sending exactly what comes back and where: the line's share of what was paid, the platform voucher share returned pro rata, and the shop and shipping vouchers that are not. The window is the platform's policy, never phrased as a legal right. After sending, the request has its own status page with the ReturnRequest statuses from object-model.md#enums; Market's review, the shop, the carrier, and the inspection are all mock counterparties driven by Demo controls.

## P0 stories

- US-RET-001 — Request a return or refund
- US-RET-002 — Return request status

## P1 backlog

| Title | Why P1 |
|---|---|
| Return part of a line's quantity | P0 returns whole lines (`lineIds[]`); partial quantity needs a qty picker and a second split level. |
| Return-shipping carrier pickup booking | P0 asks for a tracking code after the buyer ships; booking a pickup needs a carrier slot model. |
| Escalate a rejected request to the platform | Needs a complaint object and a reviewer role; P0 ends at "Từ chối" with the reason. |
| Xu refunds on returns | Xu is P1 (rules.md#voucher-math item 8). |
| Rate the return experience | Nice closure step from the research; not in the demo loop. |
| 24-hour window for fresh and frozen food | The catalogue has no fresh-food category in P0. |
| Choose a refund destination (bank account vs wallet) for COD orders | P0 refunds a COD order to one seeded bank account; a picker adds data entry with no demo value. |

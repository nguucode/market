---
code: FND
name: Foundation
route: /
summary: Shell for both layouts with nav from sitemap.yaml, the single VND/date/phone/count formatter, the mock store with seed, latency, persistence and cross-window sync, demo controls, /device, 404 and error boundary, the product card, sheets and side panels, empty/loading/error states with the sample-data badge, toasts and confirmation dialogs, and the legal footer.
---

# FND · Foundation

Everything every other Epic stands on. One route tree renders two layouts, chosen by viewport width and never by route: web (≥ 1024px) with a header, a search pill and an editorial category row; app (< 1024px) with a tab bar and a per-screen header. Both are built from `spec/ia/sitemap.yaml`, so the nav cannot drift from the spec. A single mock store, seeded with a fixed seed and resolved against "now" at load, holds all state with visible latency, persists across reloads and syncs to `/device`. Demo controls let a reviewer push orders, payments, returns and the clock to any state. The shared patterns (product card, sheet/side panel, toast, confirm dialog, empty/loading/error, footer) are defined once here in the reference study's grammar: warm paper background, one ink colour, serif headings over sans body, borderless image-led cards, black pill CTA, and a single deal colour that is not red.

## P0 stories

- US-FND-001 — App shell for both layouts with nav from sitemap.yaml
- US-FND-002 — VND, date, phone, and count formatting
- US-FND-003 — Mock store, catalogue data, and latency
- US-FND-004 — Demo controls panel
- US-FND-005 — Phone-frame preview at /device
- US-FND-006 — Not-found page and error boundary
- US-FND-007 — Product card
- US-FND-008 — Bottom sheet and side panel pattern
- US-FND-009 — Empty, loading, and error states with the sample-data badge
- US-FND-010 — Toasts and confirmation dialogs
- US-FND-011 — Legal footer and policy pages

## P1 backlog

| Title | Why P1 |
|---|---|
| Sign out and guest browsing with OTP sign-in | The demo has one signed-in persona (research Q7); "Đăng xuất" is shown disabled in P0. |
| Sheet history entries (browser back closes an open sheet) | Nice on mobile web, but no step of the demo loop depends on it. |
| Dark theme | The reference study's grammar is a warm light paper; a dark variant doubles token work before DESIGN.md exists. |
| Offline banner and retry queue | Mock data never goes offline; latency and error injection already show the states. |
| Product menu at /product rendering spec/ | Case-study layer, P1 by README. |
| Card hover quick-add ("Thêm vào giỏ" on the card) | VN buyers pick a Phân loại first; quick-add needs the variant sheet on every grid. |

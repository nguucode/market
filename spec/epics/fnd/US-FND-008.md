---
id: US-FND-008
title: Bottom sheet and side panel pattern
epic: FND
priority: P0
status: Draft
size: S
routes: ["/p/:slug", "/cart", "/search"]
dependsOn: [US-FND-001]
---

## Story

As a buyer, I want choices like a Phân loại, a voucher or an address to open over the page I am on and close back to it, so that I never lose my place to make a small decision.

## Acceptance criteria

- Given the app layout, when a screen opens an overlay, then it slides up as a bottom sheet with a grab handle, a title, a close button "Đóng", content that scrolls inside, and an optional sticky footer with one black pill action; its height fits the content up to 90% of the viewport.
- Given the web layout, when a screen opens the same overlay, then it renders as a side panel from the right (420px, full height) with the same title, close, scrolling content and sticky footer; the page behind stays visible under a scrim.
- Given an overlay is open, then focus moves to its title, Tab cycles inside it, and Esc, a click on the scrim, "Đóng" or (app) a downward drag past 30% of its height closes it; focus then returns to the control that opened it.
- Given an overlay with unsaved input (for example the address form), when I try to close it, then the confirm dialog from US-FND-010 asks "Bỏ thay đổi?" with "Tiếp tục chỉnh sửa" and "Bỏ"; overlays without input close immediately.
- Given one overlay opens another (the address list opens the address form), then the second stacks on top, and closing it returns to the first, never to the page.
- Given an overlay is open, then the page behind does not scroll, and screen readers see it as `role="dialog"` with `aria-modal="true"` and `aria-labelledby` its title.

## UI states

- Empty: content area shows the caller's empty state (US-FND-009) inside the sheet.
- Loading: the sheet opens at once with the caller's skeleton; it never waits for data to open.
- Error: the caller's inline error with "Thử lại" inside the sheet; the sheet stays open.
- Unavailable: none.
- Overflow: long lists (40 addresses, 30 SKUs, 20 vouchers) scroll inside the content while title and footer stay pinned; a sheet title with a 40-character shop name truncates with "…"; with the on-screen keyboard open (app) the footer stays above the keyboard.

## Design notes

- App (< 1024): paper surface, 16px top corners, grab handle 36×4px at 30% ink, title serif 18px, 16px side padding, footer pill 48px full width over a hairline. Scrim ink at 40%.
- Web (≥ 1024): side panel 420px, paper surface, the soft warm shadow from the reference study (overlay level), title serif 20px, footer pill full panel width.
- Motion: 200ms ease-out slide; none under `prefers-reduced-motion`.

## FE notes

- `src/components/Overlay.tsx` renders `Sheet` or `SidePanel` from `useLayout()`; screens use one API: `<Overlay open title footer onClose dirty>`.
- An overlay stack in a small context; `closeTop()` handles Esc. Overlay state is not in the URL in P0 (Enhanced by FND P1: Sheet history entries).
- Scroll lock with `overflow: hidden` on `body` plus `overscroll-behavior: contain` in the sheet.

## Mock data

- None of its own; verified with the variant sheet on the 2×6 variant product (30 SKUs) and an address list with 40 entries (test fixture only).

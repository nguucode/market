---
id: US-FND-005
title: Phone-frame preview at /device
epic: FND
priority: P0
status: Draft
size: S
routes: ["/device"]
dependsOn: [US-FND-001, US-FND-003, US-FND-004]
---

## Story

As a reviewer on a laptop, I want to use the real app layout inside a phone frame with demo controls beside it, so that I can judge the mobile experience and drive orders from one screen without picking up a phone.

## Acceptance criteria

- Given I open `/device` at a viewport ≥ 1024px, then I see a 390×844 phone frame containing a same-origin iframe of Market at `/` in the app layout, and the Demo controls panel docked beside it (US-FND-004).
- Given `/device?path=/cart`, then the iframe opens at `/cart`; given I navigate inside the frame, then the page URL's `path` updates (replace, not push) so the link can be shared.
- Given the toolbar above the frame, then it shows "Xem trên điện thoại", "Tải lại" (reloads the iframe) and "Mở bản web" (opens the same path outside the frame).
- Given I act in the panel or in another tab of the web layout, then the frame reflects the change within one second (US-FND-003 sync), and the reverse holds.
- Given the window is shorter than the frame plus margins, then the frame scales down uniformly to fit, never below 0.6, and the page itself never scrolls.
- Given I open `/device` at a viewport < 1024px, then I see "Bạn đang dùng màn hình nhỏ. Market đã hiển thị dạng ứng dụng." with "Về Trang chủ" → `/`, and no frame.

## UI states

- Empty: not applicable.
- Loading: the frame shows the paper background with the inner app's own skeletons; the panel is usable immediately.
- Error: if the iframe fails to load, the frame shows "Không tải được bản điện thoại" with "Tải lại".
- Unavailable: none.
- Overflow: at 1024×700 the frame scales to fit beside a 360px panel; the "Dữ liệu mẫu" badge stays visible inside the frame; a `path` that does not exist shows the inner 404 (US-FND-006), not a broken frame.

## Design notes

- Web only by definition (`shell: none`). Frame: 1px ink border, 48px corner radius, a 4px home-indicator bar, no device brand or chrome; centred in the space left of the panel on a cool neutral background that is distinct from the paper colour.
- The inner app is the real app layout (tab bar, sheets, sticky bars), not a mock-up. Inside the frame, the "Dữ liệu mẫu" badge does not open a second demo panel because the panel is already beside the frame.

## FE notes

- `src/demo/DevicePage.tsx`; iframe `src={path + '?embedded=1'}` (query merged) so the inner app suppresses its own demo panel and never redirects. `title="Market trên điện thoại (mô phỏng)"`.
- Track inner navigation with a `postMessage({ type: 'market:navigated', path })` from the inner router plus the iframe `load` event; `sanitizePath(path)` (pure, TDD) allows only same-origin paths starting with `/` and not `/device`.
- Scale with CSS `transform: scale()` from a `ResizeObserver`; `fitScale(viewport, frame, panel)` pure and TDD (clamped 0.6–1).

## Mock data

- Default seed; check with the 3-shop cart at 390px and an order advanced from the panel while the frame shows `/orders/:id`.

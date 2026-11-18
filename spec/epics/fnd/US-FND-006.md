---
id: US-FND-006
title: Not-found page and error boundary
epic: FND
priority: P0
status: Draft
size: S
routes: ["*"]
dependsOn: [US-FND-001]
---

## Story

As a buyer who followed a dead link or hit a broken screen, I want a calm page that tells me what happened and gets me back to shopping, so that one bad link never ends my session.

## Acceptance criteria

- Given a URL that matches no route in `sitemap.yaml`, then the page titled "Không tìm thấy trang" shows the serif heading "Không tìm thấy trang", the line "Trang bạn tìm không tồn tại hoặc đã được chuyển đi.", the black pill "Về Trang chủ" (→ `/`) and a secondary link "Tìm sản phẩm" (→ `/search`), inside the normal shell.
- Given a route that exists but whose entity does not (`/p/khong-co`, `/s/khong-co`, `/orders/MK000000000000`, `/c/khong-co`, `/policies/khong-co`), then the same page renders with an entity-specific line: "Sản phẩm không tồn tại.", "Shop không tồn tại.", "Không tìm thấy đơn hàng.", "Danh mục không tồn tại.", "Trang không tồn tại.". A delisted product is not a 404; its page is owned by PDP.
- Given a screen throws while rendering, then the error boundary replaces only the content area with "Đã có lỗi xảy ra", the line "Màn hình này gặp sự cố. Dữ liệu của bạn vẫn được giữ nguyên.", the pill "Thử lại" (remounts the screen) and "Về Trang chủ"; header, tab bar and the "Dữ liệu mẫu" badge stay.
- Given the error boundary has caught an error, when I navigate to another route, then the boundary resets and the new screen renders normally.
- Given either page, then `document.title` is "Không tìm thấy trang · Market" or "Đã có lỗi xảy ra · Market" and focus moves to the heading.

## UI states

- Empty: this story is itself the empty state for unknown routes.
- Loading: an entity lookup (`/p/:slug`) shows the screen's skeleton first and resolves to the not-found content only after the store answers, so a slow load never flashes "Không tìm thấy".
- Error: covered above; an error inside the error page falls back to a static HTML message in the root boundary.
- Unavailable: none.
- Overflow: a 300-character URL path is never echoed on the page (no reflected input).

## Design notes

- Web (≥ 1024): centred column max-width 560 on the paper background, a single editorial image (4:5, 8px radius) above the serif heading, body 16px, pill CTA under it. Footer (US-FND-011) shows below.
- App (< 1024): back + title header, same content stacked, tab bar visible only if the URL was a tab route; CTA full width.
- No red, no error icon in a warning colour: it is a dead end, not an alarm.

## FE notes

- Router catch-all `*` renders `NotFoundPage`; entity screens call `notFound(kind)` which renders the same component with `kind`.
- `ErrorBoundary` keyed by `location.pathname` so navigation resets it; logs to console only.
- `resolveScreen` from US-FND-001 returns `not-found` for unmatched paths (TDD case).

## Mock data

- None beyond the seed; test with unknown slugs and a test-only route that throws.

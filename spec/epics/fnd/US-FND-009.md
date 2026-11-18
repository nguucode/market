---
id: US-FND-009
title: Empty, loading, and error states with the sample-data badge
epic: FND
priority: P0
status: Draft
size: S
routes: ["/", "/cart", "/orders"]
dependsOn: [US-FND-001]
---

## Story

As a buyer, I want every screen to tell me plainly when there is nothing, when it is still loading, and when something failed, and as a reviewer I want to know at a glance that the data is sample data, so that no screen is ever blank or misleading.

## Acceptance criteria

- Given any screen, then a small "Dữ liệu mẫu" badge is visible at 375px and 1440px (rules.md#spec-conventions); in the app layout tapping it opens Demo controls (US-FND-004), on web it is informational with the tooltip "Toàn bộ shop, sản phẩm và đơn hàng là dữ liệu mẫu."
- Given a list or grid with no items, then the shared empty state shows a serif one-line heading, one sentence of help and at most one pill action, with copy supplied by the screen, for example "Giỏ hàng của bạn còn trống" / "Thêm sản phẩm bạn thích rồi quay lại đây nhé." / "Mua sắm ngay" (→ `/`).
- Given data is loading, then the screen shows skeletons shaped like its content (cards 4:5, list rows, text bars); skeletons appear only after 150 ms so fast loads do not flicker, and are announced once with `aria-busy="true"`.
- Given a load fails, then the shared error state shows "Không tải được dữ liệu", the line "Kiểm tra kết nối rồi thử lại.", and the pill "Thử lại", which re-runs only the failed query.
- Given part of a screen fails (one Home section), then only that part shows a compact inline error "Không tải được mục này." with "Thử lại"; the rest of the screen renders.

## UI states

- Empty: defined here; each story supplies its own copy.
- Loading: defined here.
- Error: defined here.
- Unavailable: none.
- Overflow: empty-state copy longer than two lines wraps within 360px; the badge never covers a sticky action bar or the tab bar.

## Design notes

- Web (≥ 1024): empty and error states centred in the content column, max-width 480, heading serif 24px, body 16px, pill under. Badge: a pill fixed at the bottom-left of the viewport, 11px uppercase-free text "Dữ liệu mẫu", neutral outline, 16px from the edges.
- App (< 1024): same states, heading serif 20px, CTA full width. Badge: a pill fixed at the bottom-left, 8px above the tab bar or the screen's sticky bar (whichever is present), 44px tap target around a 22px-high pill.
- Skeletons in a warm grey a few steps darker than the paper, with a slow shimmer that stops under `prefers-reduced-motion`. No illustrations in P0; an editorial image only on 404 (US-FND-006).

## FE notes

- `src/components/states/{EmptyState,ErrorState,InlineError,Skeleton*}.tsx` and `SampleDataBadge.tsx` (mounted once in the shell, also in `shell: none` pages except the printable invoice).
- `useDelayedFlag(loading, 150)` (pure hook logic tested with fake timers).
- `useStickyOffset()` lets sticky bars register their height so the badge sits above them.

## Mock data

- Exercised with the latency override "3 giây" and an emptied cart; error state via a unit-test store that rejects.

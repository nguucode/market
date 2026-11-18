---
id: US-SHP-001
title: Shop header with follow
epic: SHP
priority: P0
status: Draft
size: M
routes: ["/s/:handle"]
dependsOn: [US-FND-001, US-FND-003, US-FND-006]
---

## Story

As a buyer, I want the shop page to show at a glance who the shop is and how it performs, and to follow it in one tap, so that I can decide to trust it and find it again.

## Acceptance criteria

- Given I open `/s/:handle`, then the header shows the banner, avatar, shop name, the "Shop chính hãng" badge when `isOfficial`, location, rating with count ("4,9 ★ (12,3k)"), "{n} người theo dõi", "{n} sản phẩm", "Tỉ lệ phản hồi {n}%", "Phản hồi {responseTime}", and "Tham gia {dd/mm/yyyy}".
- Given I do not follow the shop, when I press "Theo dõi", then it changes to "Đang theo dõi" at once (optimistic), the follower count increases by one, and the toast "Đã theo dõi Shop" shows.
- Given I follow the shop, when I press "Đang theo dõi", then it changes back to "Theo dõi", the count decreases by one, and the toast "Đã bỏ theo dõi Shop" with "Hoàn tác" shows; no confirmation dialog.
- Given the store rejects a follow change, then the button and count revert and the toast reads "Không cập nhật được. Thử lại."
- Given the tab bar "Shop", "Sản phẩm", "Danh mục", "Đánh giá", "Giới thiệu", when I pick a tab, then `?tab=shop|products|categories|reviews|about` updates (push), the default with no `tab` is `shop`, and an unknown value falls back to `shop` with `replace`.
- Given the `shop` tab, then it shows the shop vouchers row (US-SHP-003) and the shop's best-sellers and all products (US-SHP-002).
- Given a handle that does not exist, then the not-found page renders (US-FND-006).

## UI states

- Empty: a shop with no banner shows a paper-tint band with the avatar; a shop with 0 followers shows "0 người theo dõi".
- Loading: banner block and header lines as skeletons; tab content skeletons per tab.
- Error: shop fails to load → "Không tải được Shop. Thử lại." with "Thử lại".
- Unavailable: none in P0 (no closed shops in mock data).
- Overflow: the 40-character shop name wraps to two lines on web and truncates to one line on app with the full name in the accessible name; "1,5k người theo dõi" stays in the compact count (rules.md#spec-conventions); facts wrap to a second line rather than shrink.

## Design notes

- Web (≥ 1024): banner full content width, 240px high, 8px radius; avatar 96px overlapping its bottom-left edge; name in the serif 32px; facts as one muted line separated by dots (the reference study's shop header); "Theo dõi" as a black pill, "Đang theo dõi" as an outline pill, right-aligned. Tabs as text tabs with an ink underline, sticky under the header on scroll.
- App (< 1024): banner 140px with a dark scrim, avatar 64px, name and badge over the scrim in paper colour, a 3-column fact row (rating, followers, response rate) below; the follow pill on the right of the name. Tabs scroll horizontally and stick under the back/title header.
- Official badge: small ink pill with a check, identical to PDP (US-PDP-006).

## FE notes

- Route `/s/:handle?tab=`; `useShop(handle)` from the store.
- Store: `follows.toggle(shopId)` → new state; `useIsFollowing(shopId)`; follower count derived as seed `followers` + (following ? 1 : 0) − (seed followed ? 1 : 0) so it never drifts.
- Pure, TDD: `followerCount(seedFollowers, seedFollowed, following)`, `parseShopTab(value)`.
- Tab content is lazy per tab; the header never re-renders on tab change.
- Enhanced by SHP P1: Chat with the shop; Followed shops list.

## Mock data

- An official TP.HCM shop with banner and 1,5k followers (persona not following), a Đà Nẵng shop the persona follows, a shop without banner, and the 40-character shop name.
- Demo error toggle to show the follow revert.

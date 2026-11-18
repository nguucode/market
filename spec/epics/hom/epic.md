---
code: HOM
name: Home
route: /
summary: The Home page in the reference study's calm editorial grammar, carrying the VN marketplace essentials: an editorial hero, category shortcuts, one flash-sale band, a claimable voucher strip, themed rails, and the "Gợi ý hôm nay" grid.
---

# HOM · Home

Home is where Market's two influences meet. VN marketplace homes sell from every pixel: banners, icon grids, a ticking flash sale, red badges on every card. The reference study's home reads slowly: one editorial block, image-led rails, prices standing alone. Market keeps the VN content and lowers the voice (research §7.2): one serif hero instead of a banner carousel, round image tiles for categories, exactly one flash-sale band with a text countdown and a sold bar in the deal colour, a short strip of platform vouchers to save, two or three curated rails, then an endless-feeling but bounded recommendations grid. Every section loads on its own and can fail on its own without taking the page down. Sections follow `sitemap.yaml#screens.home.sections` in order.

## P0 stories

- US-HOM-001 — Home frame and editorial hero
- US-HOM-002 — Category shortcuts
- US-HOM-003 — Flash sale band on Home
- US-HOM-004 — Claimable voucher strip on Home
- US-HOM-005 — Themed rails and the recommendations grid

## P1 backlog

| Title | Why P1 |
|---|---|
| Recently viewed rail ("Sản phẩm vừa xem") | Needs view tracking across PDP visits; nothing in the demo loop reads it. |
| Personalised recommendations from favourites and orders | P0 uses a seeded order; personalisation adds logic a reviewer cannot see in one session. |
| Rotating hero (scheduled editorial blocks) | One hero is enough for the demo; rotation is a CMS concern. |
| "Nhắc tôi" on the upcoming flash-sale slot from Home | Owned by PRM P1 with the flash sale page; Home links there. |
| Official-shops rail ("Shop chính hãng") with shop logos | The category row already links `/search?official=1`; a rail duplicates it. |
| Image search entry in the Home search pill | Research §1.2 mentions it; no mock pipeline for images. |

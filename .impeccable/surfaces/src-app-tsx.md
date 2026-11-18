---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface brief: Market buyer app (all routes)

Scope: the whole buyer app, web (≥1024) and app shell (<1024). Visitor mode: **Operate**. Audience, job and constraints live in PRODUCT.md and spec/; this brief keeps only the direction. This is a redesign (2026-11-18): it replaces "The Open Ledger" (warm paper, plum ink, jade, serif) and keeps every product truth, rule, string and behaviour.

## Direction contract

THESIS: A dense, price-led Vietnamese marketplace on clean white, where the full rule set (three voucher slots, flash sale, COD, one order per shop) reads at a glance and every total still unfolds into its lines. It refuses both the warm editorial boutique and the category's badge storm: no stacked badges, no gradient banners, no countdown on every card.

OWN-WORLD: White surfaces on a near-white cool grey ground (#F5F5F6), neutral graphite ink (#1A1A1A), grey #6B6B6B for metadata. One accent, Rose Cinnabar (#D6143D), doing three jobs: the 2px search border with its in-field button, the primary action, and every price; its tint (#FDEEF1) marks the selected tab, chip and voucher. Be Vietnam Pro only, no serif, weights 400/500/700, tabular numerals. Cards are white, borderless, 12px corners, square images on a #F5F5F5 well, two-line names, price large and bold in accent with the ₫ smaller. Controls are 8px-rounded rectangles, not pills; the primary action is solid accent; secondary is accent-outline on white. Soft offset shadows only on hover and overlays.

STORY: The buyer scans many products fast, judges by price and sold count, and acts; deals are visible in one label and the price colour. At cart, checkout, order and return she opens any total and sees each đồng: goods, each voucher by name, shipping, the split per shop.

FIRST VIEWPORT: Web Home: thin grey utility bar (12px links: Thông báo, Đơn mua, Tài khoản); header row with logo, a 44px search field with a 2px accent border and an in-field "Tìm kiếm" button, hot keywords beneath, cart button right; then a three-column hero: level-1 category list (left, 220px), deal banner (centre, flash sale and voucher entry), buyer card (right: greeting, order shortcuts, saved vouchers); then the "Gợi ý hôm nay" feed with tinted tab chips and a 6-column grid at 1440. App Home: accent-bordered search with cart, category icon grid, flash strip, 2-column feed on grey ground, tab bar with accent active.

FORM: Pinned by the owner, no roll. seed: none (pinned). "redesign UI, dùng màu trắng hiện đại, giao diện học hỏi từ taobao.com. Làm hết UI tất cả tính năng", the grammar measured in vault note 10-projects/market/taobao-style-study.md (grammar only, no logo, name, mascot or exact #FF5000/#FF4400). Signature move: **the money fold**, every total (cart bar, checkout, order, return refund) is a disclosure that unfolds into a ledger of named lines, with a thin proportional bar showing how a session discount splits across shops.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

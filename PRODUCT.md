# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated (owner: "theo recommend của bạn", 2026-11-18): React 19 + Vite + TypeScript + React Router 7 + Tailwind v4 + Radix, Vitest, axe, the same stack as Fortify and Wallet. One app with two layouts on one route tree: web (≥ 1024px, header with search) and app shell (< 1024px, tab bar, sheets). A `/device` route renders the app shell in a 390×844 phone frame for desktop reviewers, as in Wallet. Deployed to Cloudflare Workers static assets at market.ontheshore.biz; GitHub Actions deploys on push to main.

## Users

- **Persona in the product:** an urban office worker in Vietnam (persona Lê Thu Hà, 29, Đà Nẵng) who buys everyday goods across categories: fashion, home, kitchen, beauty, phone accessories. She browses on her phone at lunch, compares and checks out on a laptop in the evening, pays COD or by VietQR, and tracks orders and returns afterwards.
- **Audience of the demo:** enterprise product teams (PMs, BAs, POs, designers) viewing it as a portfolio case study, like Fortify and Wallet. They judge the product thinking: how marketplace rules (vouchers, split orders, cancellation, returns) and Vietnamese e-commerce law become UI. Most open it on desktop, so the mobile experience must be reviewable there (`/device`).

## Product Purpose

A front-end-only, buyer-side marketplace demo for the Vietnamese market, running on mock data from a fixed seed. It shows a general multi-category marketplace with the commerce rules Vietnamese buyers expect (shop vouchers, platform vouchers, free-shipping vouchers, flash sale, COD, one order per shop) without the visual noise those marketplaces usually carry. It succeeds when a reviewer can walk the whole loop (browse, search, product, cart, checkout, order tracking, cancel, return, review) including failure paths, and every price on screen can be explained line by line.

## Positioning

A calm marketplace whose money math is always visible. Vietnamese marketplaces sell with red banners, stacked badges and countdowns on every card; Market keeps all of the same deals and rules but presents them in a clean, dense, price-led white grammar (one label per card, one accent), and shows every voucher by name and every đồng of the split between shops. The price you see is the price you can account for.

## Operating Context

- Mobile: browsing and searching in short sessions, adding to cart, checking order status.
- Desktop: comparing products, building a multi-shop cart, checking out with vouchers, reviewing order detail and returns.
- Reviewers: open market.ontheshore.biz on desktop, switch to `/device`, and drive order, payment and return states with demo controls.

## Capabilities and Constraints

- **P0 scope:** 69 user stories in `spec/` (13 Epics). IA, rules and the build order live in `spec/`; `spec/ia/rules.md` wins over every story.
- **Rules as UI** (sources in the vault research note `10-projects/market/research/2026-11-18-vn-marketplace-domain-and-ia.md`): prices include VAT; struck-through price is the price before the promotion and the discount never exceeds 50%; checkout lists every promotion by name and every money line before "Đặt hàng"; seller identity and product label content are disclosed; two-level addresses (Tỉnh/Thành phố → Phường/Xã), no Quận/Huyện.
- **Commerce model:** three voucher slots (shop, platform, shipping) in a fixed order; one checkout with n shops creates n orders; one cancel request per order; 15-day return window; reviews never hidden.
- **Out of scope:** seller center, live streaming, chat with shops, Xu and installment (P1), real payments, real auth, real carriers.
- **Currency:** VND, whole đồng, formatted `330.448₫`.
- **Language:** UI in Vietnamese. Spec, stories and code identifiers in English.

## Brand Commitments

- Product name **Market** (working name, as Fortify and Wallet), platform voucher "Voucher Market".
- Redesign 2026-11-18 (owner: "dùng màu trắng hiện đại, giao diện học hỏi từ taobao.com"): UI follows the interface grammar measured in the vault note `10-projects/market/taobao-style-study.md` and borrows nothing of that brand: no logo, mascot, name, channel names, or exact colours (#FF5000, #FF4400). The earlier Etsy-grammar build (vault `etsy-style-study.md`) is superseded.
- No real marketplace, wallet, bank or carrier logos. Shops, products, people, carriers and wallets in mock data are fictional ("Ví Sen", "Ví Mây", "Ngân hàng Sông Hàn").

## Evidence on Hand

- Domain research with primary sources and the UI study (vault paths above). The spec in `spec/`.
- No real users, sales, ratings or testimonials. All data is mock from a fixed seed; product imagery must be royalty-free with its licence recorded. Do not fabricate partner logos or real-world metrics.

## Product Principles

1. **Every đồng is accounted for.** Any total can be expanded into its lines: goods, each voucher by name, shipping, the split per shop.
2. **Deals without noise.** Keep the rules buyers expect; express them once, in one calm voice, never as a badge storm.
3. **Law is UI.** Disclosures and rules appear where the buyer decides, with plain reasons, not as fine print or surprise errors.
4. **No hidden states.** Every order, payment, cancel request and return shows where it is and what happens next.
5. **Reviewable by design.** Demo controls and `/device` let a reviewer reach any state without setup.

## Accessibility & Inclusion

WCAG 2.2 AA, checked with axe on every route at desktop and mobile widths, as in Fortify and Wallet. Touch targets at least 44px on the app shell. Vietnamese diacritics never clip, including in serif display sizes. Prices are read correctly by screen readers (VND, not decimals).

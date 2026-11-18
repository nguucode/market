---
name: Market
description: A dense, price-led Vietnamese marketplace on clean white, where every total unfolds into its lines.
colors:
  ground: "#f5f5f6"
  surface: "#ffffff"
  well: "#f5f5f5"
  ink: "#1a1a1a"
  ink-2: "#3a3a3a"
  muted: "#6b6b6b"
  line: "#ebebeb"
  line-strong: "#d4d4d4"
  accent: "#d6143d"
  accent-ink: "#b00f33"
  accent-soft: "#fdeef1"
  danger: "#b42318"
  danger-soft: "#fdecea"
  warn: "#8a4b00"
  warn-soft: "#fff4e0"
  ok: "#0f7a4f"
  ok-soft: "#e7f6ee"
typography:
  display:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  body-dense:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
  meta:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  tag:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
  price:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  price-total:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  price-hero:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  tag: "4px"
  inner: "6px"
  control: "8px"
  card: "12px"
  sheet: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  page-web: "32px"
  page-app: "12px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-ink}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.accent-soft}"
  button-tint:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  chip:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  search-field-web:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    height: "44px"
  product-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "8px 10px 10px"
  card-label:
    textColor: "{colors.accent-ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    height: "18px"
  price-band:
    backgroundColor: "{colors.accent-soft}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  tab-bar-app:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    height: "58px"
---

# Design System: Market

## Overview

**Creative North Star: "The Bright Counter"**

A white shop counter under even light. Every product sits on its own clean white card on a cool near-white floor, and the only colour on the counter is the price: one red, Rose Cinnabar, that marks what things cost, where you search, and what you press to buy. The grammar is the dense Chinese-marketplace grammar (a Taobao-style feed, a three-column web hero, a tinted price band, a fixed app tab bar) with nothing borrowed from any brand: no logo, no mascot, no channel names, no exact brand colours.

Density is the point and calm is the condition. Six product columns at 1440, two on the phone, 13 and 14px text, tight 8 to 12px gaps. Calm comes from what is withheld: one label per card, no stacked badges, no gradient banners, no countdown on every card, no shadow at rest. The buyer judges by price and sold count, then acts; at cart, checkout, order and return she opens any total and sees each đồng.

The money fold is the system's signature. Every total in the money path is a disclosure that unfolds into a ledger of named lines, and when one payment splits into several shop orders, a thin proportional bar shows the split.

**Key Characteristics:**
- White surfaces on a cool grey ground; depth by tone, shadow only on hover and overlays.
- One accent, Rose Cinnabar, with three jobs: search, primary action, every price.
- Be Vietnam Pro only, tabular numerals for all money.
- 8px controls, 12px cards, pills only for counters and round icon buttons.
- Every total is a money fold.

## Colors

A neutral graphite-on-white palette with a single red that means money and action.

### Primary
- **Rose Cinnabar** (accent): the 2px search border and its in-field button, solid primary buttons, every price, the active app tab, the cart count badge, the wordmark, the focus ring, checked checkboxes.
- **Deep Cinnabar** (accent-ink): accent as text on white or tint (selected chip text, secondary button text, discount amounts in the fold, links) and the primary button's hover. Use it whenever red text must pass contrast at small sizes.
- **Cinnabar Blush** (accent-soft): the selected state everywhere (tab chips, filter chips, sort segment, chosen voucher, highlighted menu row), the discount tag, the empty-state icon disc, and the one deal surface per page: the product page's price band.

### Neutral
- **Cool Floor** (ground): the page background behind all white panels, and the web utility bar.
- **Counter White** (surface): cards, panels, header, sheets, tab bar.
- **Well Grey** (well): unselected chips, ghost hover, quantity stepper hover, skeleton base, image fallback.
- **Graphite** (ink): body text and names. Also the 45% scrim and the 92% toast.
- **Soft Graphite** (ink-2): secondary text, form labels, fold line labels.
- **Ash** (muted): metadata, sold counts, struck prices, placeholders, inactive tabs.
- **Hairline** (line) and **Rule** (line-strong): dividers and section borders; line-strong for input rings, the fold's dashed rule and disabled fills.

### Status
- **Danger** (danger / danger-soft), **Warn** (warn / warn-soft), **OK** (ok / ok-soft): form errors, destructive confirm, order and return status. Status colour never stands in for price.

### Named Rules
**The Price Is the Colour Rule.** The accent is reserved for search, the primary action and money. Nothing decorative is red: no red headings, no red section backgrounds, no red borders on cards.

**The One Tinted Block Rule.** Cinnabar Blush marks selection anywhere, but only one block per page may be a tinted surface: the product page's price band. Every other container stays white.

## Typography

**Display Font:** Be Vietnam Pro (with ui-sans-serif, system-ui)
**Body Font:** Be Vietnam Pro
**Label/Mono Font:** none; numerals use the same face with `tabular-nums`.

**Character:** One Vietnamese-native sans in four weights (400, 500, 600, 700) carries everything. The display voice is the same face at 700 with -0.015em tracking, never a second family; diacritics stay open at every size.

### Hierarchy
- **Display** (700, 22px app / 24px web, 1.2): page titles.
- **Headline** (700, 18px app / 20px web, 1.25): section heads ("Gợi ý hôm nay", "Flash sale").
- **Title** (600, 16px, 1.35): app top-bar title, sheet titles, buyer greeting.
- **Body** (400, 14px, 1.45): default text, product names (500, two lines, 20px leading), inputs.
- **Body dense** (400, 13px): fold ledger lines, filters, footer links, secondary rows. The single most used size.
- **Label** (600, 13px): small buttons, the search button, small section labels. Buttons md use 14px, lg 15px.
- **Meta** (400, 12px): sold count, ratings, hints, utility bar, split names.
- **Tag** (600, 11px): the one card label, counts in tabs, app tab bar labels.
- **Price** (700, tabular, accent): 14 / 18 / 22 / 32px for sm / md (card) / total (fold, cart bar) / hero (product page).

### Named Rules
**The Same Run Rule.** The ₫ sign stays in the same text run as the number, so a price reads, wraps and tests as one string, and screen readers hear VND, not decimals.

**The Tabular Money Rule.** Every amount (prices, totals, counts in badges, fold lines) uses tabular numerals so columns of money align.

## Layout

Web (≥1024px) is a centred 1440px frame with 32px side gutters: a 36px grey utility bar, an 88px white sticky header (wordmark, 820px-max search with hot keywords beneath, cart button), a 40px shortcut row, then content on the grey floor. Narrower reading frames step down through 1280, 1200, 1120 and 1040px for checkout, order and account pages. The home hero is three columns: a 220px level-1 category list, a deal banner, and a buyer card.

App (<1024px) uses 12px side gutters, a sticky white header, and a fixed five-tab bar (58px plus safe area). Touch targets are 44px minimum; icon buttons are 44px circles.

Product grids are 2 columns (8px gap) on the phone, 3 at md, 5 at lg, 6 at xl (12px gap). Rails scroll horizontally with a 40% card peek on the app and become grids on web. Panels (white, 12px corners) sit on the ground with 12 to 20px between them. Spacing steps in 4px units; 8, 12, 16 and 20px do most of the work.

## Elevation & Depth

Flat at rest. Depth is tonal: white panels on the cool floor, hairline rules inside them. Shadows are soft, low-offset, cool-tinted, and appear only as a response to state (card hover) or for things that float (dropdowns, dialogs, side panels, sheets, the sticky header's hairline, the bottom bars).

### Shadow Vocabulary
- **Hover** (`0 4px 12px rgb(20 20 30 / 0.08), 0 1px 3px rgb(20 20 30 / 0.06)`): product card hover only.
- **Pop** (`0 8px 24px rgb(20 20 30 / 0.12), 0 2px 6px rgb(20 20 30 / 0.06)`): dropdowns, search suggestions, dialogs, side panels, toasts.
- **Sheet** (`0 -8px 28px rgb(20 20 30 / 0.14)`): app bottom sheets.
- **Bar** (`0 -1px 0 line, 0 -4px 14px rgb(20 20 30 / 0.05)`): the app tab bar and sticky checkout/cart bars.
- **Hairline** (`0 1px 0 line`): sticky headers.

### Named Rules
**The Flat Counter Rule.** Nothing casts a shadow at rest. If a white panel needs separation, the grey floor gives it.

## Shapes

Gently rounded rectangles. Controls (buttons, inputs, chips, steppers, menu rows, the price band) take 8px. Containers (product cards, panels, dialogs, dropdowns, radio cards, the web search field) take 12px. Small tags (the card label, discount tag, "Đánh giá của bạn") take 4px; elements nested inside a control (the search field's "Tìm" button, toast action) take 6px. App sheets open with 16px top corners. Full rounding is reserved for counters, avatars, the checkbox, round icon buttons, the favourite button and the split bar.

Product images are square, contained (not cropped) on white with 6% inner padding, and scale to 1.02 on card hover.

## Components

### Buttons
Solid and certain; the primary is the only solid red block on most screens.
- **Shape:** 8px rectangle, never a pill.
- **Sizes:** sm 36px / 13px, md 44px / 14px, lg 48px / 15px; 600 weight.
- **Primary:** Rose Cinnabar fill, white text; hover Deep Cinnabar. Disabled: Rule fill, white text.
- **Secondary:** white with a 1px inset Rose Cinnabar ring and Deep Cinnabar text; hover fills Cinnabar Blush.
- **Tint:** Cinnabar Blush fill, Deep Cinnabar text (voucher entry points).
- **Ghost:** ink text, Well Grey hover. **Danger:** solid danger red, for destructive confirms only.
- **Focus:** 2px Rose Cinnabar outline, 2px offset, on every interactive element.

### Chips
- **Style:** 36px, 8px corners, Well Grey fill, ink text, 13px 500.
- **Selected:** Cinnabar Blush fill, Deep Cinnabar text, 1px inset accent ring. Unavailable options are struck through at 70% opacity.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Counter White on Cool Floor.
- **Shadow Strategy:** none at rest; Hover shadow on product cards only.
- **Border:** none.
- **Internal Padding:** product card 8-10px; panels 16-20px.

### Product Card
The feed's unit: square image, two-line name (14px 500), one fixed-height label slot (18px, 4px corners, accent-outline for a deal, ink-filled for sold out), lowest price in accent at 18px with "Đã bán" to its right, then rating and optional province in 12px. A round favourite button sits top right. One label, never a stack.

### Inputs / Fields
- **Style:** 44px, 8px corners, white, 1px inset Rule ring, 14px text; label above in 13px 500 ink-2.
- **Focus:** 2px inset Rose Cinnabar ring.
- **Error:** danger ring and a 12px danger message with an alert icon.
- **Search:** always a 2px accent ring with an in-field accent button ("Tìm kiếm" web, "Tìm" app).

### Navigation
- **Web:** grey utility bar of 12px links with 13px icons; white sticky header; shortcut row of 13-14px links whose active state is Cinnabar Blush with Deep Cinnabar text.
- **Tabs:** 44px, 14px, active is 600 Deep Cinnabar with a 2px accent underline; counts as Blush pills.
- **App tab bar:** five tabs, 58px, 11px labels, active in accent 600, unread counts as accent pills with a white ring.

### Price Band
The product page's price block: an 8px-cornered Cinnabar Blush surface with the hero price (24px app, 32px web) in accent, struck price and discount tag beside it. During a flash sale a solid accent strip with white text and the end time sits on top. It is the only tinted block on a page.

### Money Fold (signature)
Every total in the money path (cart bar, checkout, order detail, return refund) is a button showing its label with a chevron and the total in accent (22px, or 18px in the md size). Opening it draws a dashed Rule divider, then a 13px ledger: goods, each voucher by name as a Deep Cinnabar minus line, shipping, and a 600 total row. When the payment splits into more than one shop order, a 6px rounded bar divides by amount in alternating accent and 40% accent, with each shop's share listed in 12px beneath. It opens with a 240ms clip-and-drop (`fold-open`, expo-out) and is instant under reduced motion.

### Sheets, Dialogs, Toasts
App: bottom sheet with 16px top corners, a grabber, and a white footer bar. Web: right side panel (480px, 640px wide) or centred dialog (440px, 640px wide) at 12px corners. Scrim is graphite at 45%. Toasts are graphite at 92% with white 14px text, 10px corners, and an optional action.

### Motion
Short and ease-out: 150ms colour transitions on controls, 200ms on card hover, 160-280ms entrances (`pop-in`, `sheet-up`, `panel-in`) on `cubic-bezier(0.16, 1, 0.3, 1)`. Everything collapses to 1ms under reduced motion.

## Do's and Don'ts

### Do:
- **Do** put every price in Rose Cinnabar, 700, tabular, with the ₫ in the same run.
- **Do** make every total in the money path a money fold with named ledger lines.
- **Do** use 8px for controls and 12px for containers.
- **Do** separate white panels with the grey floor, not with borders or shadows.
- **Do** use Cinnabar Blush for every selected state (chip, tab chip, sort segment, voucher, menu row).
- **Do** use Deep Cinnabar for red text at 13px and below.
- **Do** keep touch targets at 44px on the app shell.

### Don't:
- **Don't** stack badges on a product card; one label slot, one label.
- **Don't** use gradient banners or a countdown on every card; flash timing lives in the flash strip and the price band.
- **Don't** use a serif or a second family; display is Be Vietnam Pro 700.
- **Don't** use pill-shaped buttons or chips; pills are for counters and round icon buttons only.
- **Don't** cast shadows on resting cards or panels.
- **Don't** tint a second block on a page; the price band is the only one.
- **Don't** borrow any marketplace's logo, name, mascot, channel names or exact brand orange (#FF5000, #FF4400).

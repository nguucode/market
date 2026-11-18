---
name: Market
description: A calm Vietnamese marketplace where every total unfolds into its lines.
colors:
  ground: "#f6f2ea"
  surface: "#ffffff"
  well: "#eee8dd"
  ink: "#241f29"
  ink-2: "#3d3644"
  muted: "#675f6d"
  line: "#e2dace"
  line-strong: "#c9bfb0"
  cta: "#1d1921"
  jade: "#0c6a57"
  jade-ink: "#08503f"
  jade-soft: "#e1eee8"
  danger: "#b02a1f"
  danger-soft: "#fbe8e5"
  warn: "#835000"
  warn-soft: "#fbf0d9"
typography:
  display:
    fontFamily: "Literata Variable, Georgia, Times New Roman, serif"
    fontSize: "60px"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Literata Variable, Georgia, Times New Roman, serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Literata Variable, Georgia, Times New Roman, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  price:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
    fontFeature: "tnum"
  total:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "tnum"
rounded:
  check: "6px"
  media: "8px"
  field: "10px"
  inset: "12px"
  menu: "14px"
  card: "16px"
  sheet: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.cta}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.ink-2}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.well}"
  button-jade:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-jade-hover:
    backgroundColor: "{colors.jade-ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.well}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.jade-soft}"
    textColor: "{colors.jade-ink}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "44px"
  product-card-image:
    backgroundColor: "{colors.well}"
    rounded: "{rounded.media}"
  card-label:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  card-label-deal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.jade-ink}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  toast:
    backgroundColor: "{colors.cta}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "10px 10px 10px 20px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    height: "58px"
---

# Design System: Market

## Overview

**Creative North Star: "The Open Ledger"** (provisional; named after the first build, open to rename)

Market sells with the full Vietnamese rule set (three voucher slots, flash sale, COD, one order per shop) and keeps all of it quiet. The system is warm paper under white working surfaces, one plum-black ink, and a single jade accent that carries the brand mark, search, deal prices, selection and focus. Products, not promotions, fill the viewport: borderless 4:5 image cards on a beige well, a serif voice for headings, a plain sans for everything that has to be read fast.

The defining device is the money fold. Every total in the product (cart bar, checkout summary, order, return refund) is a disclosure that opens into a ledger of named lines, with a thin jade bar showing how a session total splits across shops. The rest of the system is tuned so that this ledger reads as the most precise thing on the screen: tabular figures, hairline and dashed rules, no colour except jade for money that leaves the bill.

Density is Operate-grade: 13 and 14px carry most of the interface, pills carry every action, and depth exists only where something floats over the page. Two layouts share one route tree: web at 1024px and up, an app shell with tab bar and bottom sheets below it.

**Key Characteristics:**
- Warm paper ground, white surfaces, one ink, one jade accent.
- Serif (Literata) for page titles, section heads and empty states; Be Vietnam Pro for everything else.
- Borderless image-led product cards at 4:5 on a beige well, 8px corners.
- Every button and chip is a pill; the primary action is a black pill.
- Totals are folds that open into named ledgers.
- Flat at rest; warm soft shadows only on overlays and fixed bars.

## Colors

A warm neutral world with a single cool accent; red appears only when something has gone wrong.

### Primary
- **Ledger Jade** (jade): the only accent. Brand mark, search submit, deal price, selected chip ring, checkbox fill, focus outline, count badges, the split bar in the money fold.
- **Deep Jade** (jade-ink): jade text on light grounds (discount percentage, voucher deduction lines, selected chip text, text links) and the hover state of jade buttons.
- **Jade Mist** (jade-soft): selected chip and radio fill, text selection, the flash-sale band.

### Neutral
- **Warm Paper** (ground): the page ground on both layouts and the text colour on black pills and toasts.
- **White Sheet** (surface): working surfaces: panels, sheets, dialogs, menus, chips, inputs, the tab bar.
- **Beige Well** (well): behind every product image, hover fill for ghost and icon buttons, skeletons, count pills.
- **Plum Ink** (ink): all primary text, star fills, the active tab underline.
- **Plum Ink Soft** (ink-2): secondary text, ledger labels, hover for the black pill.
- **Plum Grey** (muted): metadata, hints, struck prices, inactive tabs.
- **Hairline** (line) and **Hairline Strong** (line-strong): dividers and chip rings; the stronger one for input rings, the stepper ring, the dashed fold rule and disabled fills.
- **Press Black** (cta): the primary pill and the toast.

### Status
- **Brick** (danger) on **Brick Mist** (danger-soft): errors, destructive confirm, required asterisks.
- **Amber Ink** (warn) on **Amber Mist** (warn-soft): warnings and pending states.

### Named Rules
**The Jade Deal Rule.** A deal price is jade, never red. Red is reserved for failure; a discount is good news.

**The One Accent Rule.** Jade is the only hue that signals. Labels on cards are white pills with ink or jade text, not coloured badges.

## Typography

**Display Font:** Literata Variable (with Georgia, Times New Roman), optical sizing on, -0.01em tracking.
**Body Font:** Be Vietnam Pro 400/500/600/700 (with ui-sans-serif, system-ui).

**Character:** A bookish serif names things; a Vietnamese-native sans does the work. The serif never touches numbers or controls.

### Hierarchy
- **Display** (600, 28px app to 48px at lg to 60px at xl, 1.06 to 1.12): the home headline only.
- **Headline** (600, 26px app, 32px web, 1.15): page titles via the page-title helper.
- **Title** (600, 20px app, 24px web): section heads; 19px for empty-state titles; the wordmark at 22px.
- **Body** (400, 14px, 1.45): default text, product names on cards (one line, truncated), inputs.
- **Body small** (13px): chips, field labels, ledger lines, secondary nav, small buttons.
- **Label** (11 to 12px, 500 to 600): hints, card labels, metadata rows, tab bar labels, badges. Never uppercase, never letterspaced.
- **Price** (700, tabular): 14 / 16 / 22 / 28 to 30px by size; totals in the fold at 22px (17px compact).

### Named Rules
**The Tabular Money Rule.** Every amount of money is tabular and set in the sans. Screen readers get the spoken VND form on totals.

**The Serif Names Rule.** Literata is for titles, section heads, the wordmark, shop monograms and empty-state titles. Sheet titles and app-bar titles stay in the sans.

## Layout

Two layouts on one route tree, switched at 1024px by viewport width alone. Web: a 1440px max container with 32px side padding, a sticky 68px header (wordmark, category menu, full-width search pill, icon nav) over a 44px shortcut row, content from 24px below. App: 16px gutters, a sticky 56px header (back, title, cart), a fixed 58px tab bar, sheets instead of side panels.

Product grids run 2 / 3 / 4 / 5 columns (base, md, lg, xl) with 12px column gaps and 24px row gaps. Rails scroll with a 42% peek on the app and become a 5-column grid on web. Stacks breathe on a 4px base: 8, 12, 16 inside components, 16 and 24 between blocks, 64px before the footer. Summary panels on checkout and cart are sticky on web.

## Elevation & Depth

Flat at rest. Depth comes from tone: white surfaces on warm paper, beige wells behind images. Shadows are warm (brown-black at low alpha) and appear only on things that float over the page.

### Shadow Vocabulary
- **Pop** (`0 6px 16px rgb(32 20 8 / 0.08), 0 12px 32px rgb(32 20 8 / 0.08)`): dialogs, side panels, dropdown menus, toasts.
- **Sheet** (`0 -8px 28px rgb(32 20 8 / 0.12)`): app bottom sheets.
- **Bar** (`0 -1px 0 line, 0 -6px 18px rgb(32 20 8 / 0.05)`): the tab bar and sticky bottom action bars.

### Named Rules
**The Overlay-Only Shadow Rule.** If it does not float over content, it has no shadow. Headers separate with a hairline and a translucent paper backdrop blur (6px), not a shadow.

## Shapes

Two silhouettes: the pill for anything you press, and soft rectangles for anything that holds content, with radius growing with the size of the container. Checkbox 6px; product media and skeletons 8px; inputs and menu items 10px; inset panels, radio cards and tiles 12px; dropdown menus 14px; summary panels and dialogs 16px; the top of an app sheet 20px. Category tiles and avatars are circles. Rules are 1px hairlines; the money fold opens on a dashed rule.

## Components

### Buttons
Confident, compact, always pills.
- **Shape:** full pill. Heights 36 / 44 / 48px (sm / md / lg) with 16 / 20 / 24px side padding, 600 weight.
- **Primary:** Press Black with paper text; hover to Plum Ink Soft. The main action of a view.
- **Secondary:** white with an inset ink ring; hover to the beige well.
- **Jade:** white on jade, hover to Deep Jade. In the kit but unused by screens; the one jade control in the build is the circular search submit inside the search pill. Keep jade fills that rare.
- **Ghost / Icon:** no fill, beige-well hover; icon buttons are 44px circles.
- **Danger:** white on brick, only inside destructive confirms.
- **Link:** Deep Jade, underline on hover.
- **Focus:** the global 2px jade outline at 2px offset.

### Chips
- **Style:** white pill, 36px min height, 13px medium, inset hairline ring; hover strengthens the ring.
- **Selected:** Jade Mist fill, Deep Jade text, jade ring. **Disabled:** muted, struck through, 70% opacity.

### Cards / Containers
- **Product card:** borderless. A 4:5 image on the beige well (object-contain, 6% inset, multiply blend), 8px corners, 3% darken on hover. At most one white pill label top-left, a heart in a 32px white circle top-right inside a 44px target, then a one-line name, the lowest price (no struck price on cards), and a muted rating and sold-count row.
- **Panels:** white on paper, 16px corners, 16 to 24px padding, no border, no shadow. Inset notes use 12px corners on paper or well.

### Inputs / Fields
- **Style:** 44px, white, 10px corners, inset Hairline Strong ring, jade caret.
- **Focus:** 2px jade ring. **Error:** brick ring and a brick message with an alert icon below.
- **Checkbox:** 20px, 6px corners, jade fill when checked. **Radio:** full 12px-corner card that turns Jade Mist with a jade ring when chosen.
- **Quantity stepper:** a 36px pill with a Hairline Strong ring and circular minus / plus.

### Navigation
- **Web header:** sticky, paper at 95% with backdrop blur and a hairline under it; shortcut row of 32px pills that fill with the well when active.
- **App:** sticky header with back button and sans title; fixed white tab bar of five, 22px icons, 11px labels, ink and semibold when active, muted otherwise; jade count badges.
- **Tabs:** 44px, hairline under the row, a 2px ink underline on the active tab.

### Sheets, Dialogs, Toasts
- **Sheet:** bottom sheet on app (20px top corners, grab handle, slides up 280ms), right side panel on web (480 or 640px), centred 16px dialog for confirms. Ink scrim at 35%.
- **Toast:** Press Black pill, paper text, a tinted check or alert icon, an optional undo action pill; at most three, 3.2s (5s with an action).

### The Money Fold (signature)
A total that opens into its ledger. Closed: a label with a chevron on the left, the total at 22px bold tabular on the right. Open (220ms rise): a dashed Hairline Strong rule, a 13px ledger of named lines (goods, each voucher by name, shipping) with deductions in Deep Jade and a minus sign, a hairline, the total again; when the session spans shops, a 6px pill bar of alternating jade and 45% jade segments proportional to each shop order, then the per-shop amounts. Used on the cart bar, checkout, order and return refund.

## Do's and Don'ts

### Do:
- **Do** show every total as a money fold, with each voucher on its own named line.
- **Do** set every price in tabular sans; deal price in jade, struck price in muted 13px beside it.
- **Do** keep product images on the beige well at 4:5 with 8px corners and no card border.
- **Do** make every button and chip a pill, with the black pill reserved for the main action.
- **Do** keep shadows to overlays and fixed bars, using the three tokens.
- **Do** keep touch targets at 44px on the app shell, even when the visible control is smaller.

### Don't:
- **Don't** colour deals red or use red for anything but errors.
- **Don't** stack badges on a product card; one white pill label at most.
- **Don't** put borders on cards or panels; separate with tone and hairline dividers.
- **Don't** use the serif for prices, controls, sheet titles or the app bar.
- **Don't** add a second accent hue; status colours are for status only.
- **Don't** use the reference brand's fonts, exact colours, programme names or brand word.

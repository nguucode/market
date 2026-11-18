---
id: US-DSC-003
title: Search input with history and suggestions
epic: DSC
priority: P0
status: Draft
size: M
routes: ["/search"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a buyer, I want the search field to remember what I searched, show what others search, and suggest as I type, so that I reach the right results in fewer keystrokes.

## Acceptance criteria

- Given the field is focused and empty, then the input state shows "Lịch sử tìm kiếm" (my last searches, newest first, up to 10) with "Xóa lịch sử tìm kiếm", and "Tìm kiếm phổ biến" (8 trending terms as pills). With no history, only "Tìm kiếm phổ biến" shows.
- Given I type at least one character, then after a 150 ms pause up to 8 suggestions replace history: product terms matching ignoring case and diacritics ("binh giu nhiet" matches "bình giữ nhiệt"), the matched part in bold; the first suggestion also offers a scoped row "{term} trong {level-3 category}" when one category holds most matches; at most one shop row "Shop {name}" when the text matches a shop name.
- Given I press Enter or tap the search button, then I go to `/search?q={trimmed text}` (whitespace collapsed, max 100 characters), the term is added to the top of history (duplicates by normalised text removed), and the input state closes.
- Given I pick a scoped suggestion, then I go to `/search?q={term}&cat={slug}`; given I pick a shop row, I go to `/s/:handle`; given I pick a history or trending item, it behaves as if I typed it and pressed Enter.
- Given the field is empty or only spaces, when I press Enter, then nothing happens (no navigation, no history entry).
- Given I tap "Xóa lịch sử tìm kiếm", then history clears at once without a dialog (it is local and cheap to rebuild) and the section disappears.
- Given I am on a results page, when I focus the field, then it holds the current `q` with the text selected, so typing replaces it.

## UI states

- Empty: no history → only trending; no suggestion matches → one row "Tìm “{text}”" that submits the text as typed.
- Loading: suggestions compute locally from the store; no spinner. Trending is static.
- Error: storage unavailable (private mode) → history silently disabled; the input still works.
- Unavailable: none.
- Overflow: a 100-character query truncates with ellipsis in history rows; trending pills wrap to as many lines as needed; a shop name of 40 characters truncates in the shop row before the "Shop" label does.

## Design notes

- Web (≥ 1024): the header search pill (48px, 2px ink border, round search button inside, the brand colour's only use besides the logo). Focus opens a dropdown panel under the pill, same width, soft shadow: history list on top, trending pills below; suggestions replace both while typing. Arrow keys move through rows, Enter picks, Esc closes.
- App (< 1024): tapping the search pill on any screen opens `/search` in input state full screen: back arrow, the field autofocused, "Hủy" on the right; history and trending stacked; the soft keyboard's search key submits (`enterkeyhint="search"`).
- Bold-on-match uses weight only, never a highlight colour.

## FE notes

- `/search` without `q` renders the input state; with `q` it renders results (US-DSC-004). On web the dropdown lives in the header and `/search` without `q` shows the input state as a page for deep links.
- Pure, TDD: `normalizeVi(text)` (NFD, strip marks, "đ" → "d", lower case, collapse spaces), `suggest(query, catalogueIndex, shops, limit)`, `pushHistory(history, term, max = 10)`.
- History in `localStorage` key `market.searchHistory`, every read and write in try/catch.
- Suggestion index built once from product names and level-3 category names at store load (US-FND-003).
- Combobox semantics: `role="combobox"`, `aria-expanded`, `aria-activedescendant` on the input; listbox rows with `role="option"`.

## Mock data

- 8 trending terms (e.g. "bình giữ nhiệt", "áo khoác nữ", "tai nghe bluetooth").
- Seed history for the persona: 4 entries, one of them a 100-character query.
- One shop whose name contains a common product word, so a product query also yields a shop row.

---
id: US-FND-010
title: Toasts and confirmation dialogs
epic: FND
priority: P0
status: Draft
size: S
routes: ["/cart", "/p/:slug"]
dependsOn: [US-FND-008]
---

## Story

As a buyer, I want a short confirmation after I do something and a clear question before I do something I cannot take back, so that I always know what happened and never cancel an order by accident.

## Acceptance criteria

- Given an action succeeds that has no other visible result on screen (added to cart, saved a voucher), then a toast shows one line of text, for example "Đã thêm vào Giỏ hàng", with at most one action link, for example "Xem giỏ hàng" (→ `/cart`); it disappears after 4 seconds, or 8 seconds when it has an action.
- Given several toasts in quick succession, then only the newest is visible (it replaces the previous one), and hovering or focusing it pauses the timer.
- Given an irreversible or costly action (remove a cart line, cancel an order, confirm received, reset demo data), then a confirmation dialog shows a title phrased as a question ("Hủy đơn hàng này?"), one line of consequence supplied by the caller, and two buttons: the safe one first ("Không", "Quay lại") and the confirming one ("Hủy đơn hàng", "Xác nhận").
- Given the dialog is open, then focus starts on the safe button, Esc and the scrim close it as the safe choice, and the confirming action runs only on an explicit press.
- Given the confirming action is running, then its button shows a spinner and both buttons are disabled until the store resolves; on failure the dialog stays open with the error line "Không thực hiện được. Vui lòng thử lại."
- Given a toast, then it is announced through an `aria-live="polite"` region; the dialog is `role="alertdialog"` with its title and consequence as label and description.

## UI states

- Empty: not applicable.
- Loading: covered (confirming button spinner).
- Error: covered (inline in the dialog); toasts never report errors that need action, those stay inline on the screen.
- Unavailable: none.
- Overflow: a toast with a 40-character shop name truncates to two lines; dialog consequence text up to three lines; buttons stack vertically when either label exceeds the half width at 375px.

## Design notes

- Web (≥ 1024): toast bottom-centre, 16px above the viewport edge, ink background with paper text, pill shape, max 480px. Dialog centred, 400px, paper surface, 8px radius, warm shadow; confirming button is the black pill, a destructive confirm uses the same black pill (no red) with a destructive verb.
- App (< 1024): toast above the tab bar or sticky bar, full width minus 16px margins. Dialog centred at 320px max, buttons stacked full width with the confirming button on top only when stacked, otherwise side by side safe-left.

## FE notes

- `src/components/feedback/{ToastHost,useToast,ConfirmDialog,useConfirm}.tsx`; `const ok = await confirm({ title, body, confirmLabel, cancelLabel })` returns a boolean; built on the Overlay focus handling of US-FND-008 but always a centred dialog in both layouts.
- `toastQueue` reducer (replace-newest, pause/resume) pure and TDD with fake timers.

## Mock data

- None; verified with remove-line in the cart and the reset in Demo controls.

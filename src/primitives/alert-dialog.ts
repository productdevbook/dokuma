import { createDialog, type Dialog, type DialogOptions } from "./dialog.ts"

export type AlertDialogOptions = Omit<DialogOptions, "role" | "closeOnOutsideClick">
export type AlertDialog = Dialog

/**
 * A Dialog with `role="alertdialog"` and outside-click closing forced off —
 * the user must explicitly confirm or cancel via a focused action button. Use
 * for destructive confirmations and irreversible operations.
 */
export function createAlertDialog(options: AlertDialogOptions = {}): AlertDialog {
  return createDialog({
    ...options,
    role: "alertdialog",
    closeOnOutsideClick: false,
  })
}

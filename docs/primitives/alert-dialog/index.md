## About

A Dialog with `role="alertdialog"` and outside-click closing forced off — the user must explicitly confirm or cancel via a focused action button. Use for destructive confirmations (`Delete account?`, `Discard unsaved changes?`) and irreversible operations.

Behaviorally identical to Dialog otherwise: focus trap, scroll lock, Escape closes (`closeOnEscape: true` by default — pass `false` if your alert should be unescapable), focus restore on close.

## Install

```bash
pnpm add dokuma
```

## Options & Returns

Identical to [Dialog](#/dialog), minus `role` and `closeOnOutsideClick` (forced to `"alertdialog"` and `false` respectively). See `dokuma/dialog` for the full reference.

```ts
import { createAlertDialog } from "dokuma/alert-dialog"

const ad = createAlertDialog({
  defaultOpen: false,
  onOpenChange: (open) => console.log(open),
})
ad.show()
```

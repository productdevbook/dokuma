## About

A floating card shown on hover/focus that may contain interactive content (links, buttons). Differs from Tooltip in two ways:

- **Longer default delays** suited to a heavier surface — `700ms` open, `300ms` close (vs Tooltip's `700/300`, but the convention here is to avoid showing on glancing hovers).
- **`role="dialog"` content** instead of `role="tooltip"`, so screen readers don't strip its interactive children. A Tooltip with a link inside silently drops the link in many SR; HoverCard preserves it.

Use HoverCard for user mention previews, link previews, profile cards. Use Tooltip for non-interactive helper text on icons and labels.

## Install

```bash
pnpm add dokuma
```

## Options & Returns

Identical to [Tooltip](#/tooltip), minus `contentRole` (forced to `"dialog"`). See `dokuma/tooltip` for the full reference.

```ts
import { createHoverCard } from "dokuma/hover-card"

const hc = createHoverCard({
  delayShow: 300,
  delayHide: 200,
  onOpenChange: (open) => console.log(open),
})
```

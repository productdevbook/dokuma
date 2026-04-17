## About

A non-interactive floating label that appears on hover or focus. `role="tooltip"`, `aria-describedby` from the trigger when open. WAI-ARIA forbids interactive content inside a tooltip — for that, use Popover.

Positioning: viewport-aware with one-axis flip. Pure-zero deps; no Floating UI.

## Install

```bash
pnpm add dokuma
```

## Options

| Option             | Type                                     | Notes                                                          |
| ------------------ | ---------------------------------------- | -------------------------------------------------------------- |
| `defaultOpen`      | `boolean`                                | Initial state for uncontrolled mode.                           |
| `open`             | `() => boolean`                          | Controlled getter.                                             |
| `onOpenChange`     | `(open) => void`                         | Fires on open/close.                                           |
| `delayShow`        | `number`                                 | ms before showing on hover. Default `700`. Focus has no delay. |
| `delayHide`        | `number`                                 | ms before hiding after mouse leaves. Default `300`.            |
| `disabled`         | `() => boolean`                          | While true, `show()` is a no-op.                               |
| `side`             | `"top" \| "right" \| "bottom" \| "left"` | Default `"bottom"`.                                            |
| `align`            | `"start" \| "center" \| "end"`           | Default `"center"`.                                            |
| `sideOffset`       | `number`                                 | Gap between trigger and content. Default `8`.                  |
| `alignOffset`      | `number`                                 | Shift along the align axis. Default `0`.                       |
| `flip`             | `boolean`                                | Flip side on viewport overflow. Default `true`.                |
| `collisionPadding` | `number`                                 | Viewport edge padding for flip detection. Default `8`.         |

## Returns

| Member                        | Type              | Notes                                                          |
| ----------------------------- | ----------------- | -------------------------------------------------------------- |
| `open`                        | `Signal<boolean>` | Reactive state.                                                |
| `show/hide`                   | `() => void`      | Imperative actions.                                            |
| `getTriggerProps()`           | `object`          | Spread on the trigger element.                                 |
| `getContentProps()`           | `object`          | Spread on the floating content element.                        |
| `mount({ trigger, content })` | `() => void`      | Wires hover/focus/escape/touch + positioning. Returns cleanup. |

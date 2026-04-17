## About

A non-modal floating panel triggered by click. `role="dialog"` (no `aria-modal`). Focus trap by default (Popover content is interactive — Tab cycles inside). Click outside, Escape, or close button dismisses it. Returns focus to the trigger on close.

For modal flows with body scroll lock, use Dialog. For non-interactive labels, use Tooltip.

## Install

```bash
pnpm add dokuma
```

## Options

| Option                                                                   | Type                        | Notes                                                  |
| ------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------ |
| `defaultOpen`                                                            | `boolean`                   | Initial state.                                         |
| `open`                                                                   | `() => boolean`             | Controlled getter.                                     |
| `onOpenChange`                                                           | `(open) => void`            | Fires on open/close.                                   |
| `closeOnEscape`                                                          | `boolean`                   | Default `true`.                                        |
| `closeOnOutsideClick`                                                    | `boolean`                   | Default `true`. Mousedown outside content closes.      |
| `trapFocus`                                                              | `boolean`                   | Default `true`. Tab is contained while open.           |
| `restoreFocus`                                                           | `boolean`                   | Default `true`. Returns focus to the trigger on close. |
| `initialFocus`                                                           | `() => HTMLElement \| null` | Element to focus on open.                              |
| `side`, `align`, `sideOffset`, `alignOffset`, `flip`, `collisionPadding` | (positioning)               | Same shape as Tooltip.                                 |

## Returns

| Member                        | Type              | Notes                                   |
| ----------------------------- | ----------------- | --------------------------------------- |
| `open`                        | `Signal<boolean>` | Reactive state.                         |
| `show/hide/toggle`            | `() => void`      | Actions.                                |
| `getTriggerProps()`           | `object`          | Spread on the opener `<button>`.        |
| `getContentProps()`           | `object`          | Spread on the floating content.         |
| `getCloseProps(label?)`       | `object`          | Spread on a close button.               |
| `mount({ trigger, content })` | `() => void`      | Imperative DOM wiring. Returns cleanup. |

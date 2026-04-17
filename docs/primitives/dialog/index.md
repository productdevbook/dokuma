## About

A modal (or non-modal) dialog. Renders as `<div role="dialog">` with optional `aria-modal="true"`. Manages focus trap, scroll lock, escape-to-close, and click-outside-to-close. Returns focus to the opener when closed.

The primitive does **not** manage portal mounting — adapters do. Vanilla users render content into `<body>` themselves; React uses `createPortal`; Vue uses `<Teleport>`. The primitive only manages behavior.

## Install

```bash
pnpm add dokuma
```

## Options

| Option                | Type                        | Notes                                                                     |
| --------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `defaultOpen`         | `boolean`                   | Initial state for uncontrolled mode.                                      |
| `open`                | `() => boolean`             | Controlled getter.                                                        |
| `onOpenChange`        | `(open) => void`            | Fires on every open/close.                                                |
| `modal`               | `boolean`                   | Default `true`. Modal traps focus and locks `<body>` scroll.              |
| `closeOnEscape`       | `boolean`                   | Default `true`.                                                           |
| `closeOnOutsideClick` | `boolean`                   | Default `true`. Mousedown outside content closes the dialog.              |
| `initialFocus`        | `() => HTMLElement \| null` | Element to focus on open. Default = first focusable inside content.       |
| `restoreFocus`        | `boolean`                   | Default `true`. Returns focus to the previously focused element on close. |

## Returns

| Member                                   | Type              | Notes                                                          |
| ---------------------------------------- | ----------------- | -------------------------------------------------------------- |
| `open`                                   | `Signal<boolean>` | Reactive state.                                                |
| `show/hide/toggle`                       | `() => void`      | Actions.                                                       |
| `getTriggerProps()`                      | `object`          | Spread on the opener `<button>`.                               |
| `getOverlayProps()`                      | `object`          | Spread on the optional backdrop element.                       |
| `getContentProps()`                      | `object`          | Spread on the dialog container.                                |
| `getTitleProps()`                        | `object`          | Stable `id` for `aria-labelledby` wiring.                      |
| `getDescriptionProps()`                  | `object`          | Stable `id` for `aria-describedby` wiring.                     |
| `getCloseProps(label?)`                  | `object`          | Spread on a close button (`aria-label` defaults to `"Close"`). |
| `mount({ trigger?, content, overlay? })` | `() => void`      | Imperative DOM wiring. Installs all behavior. Returns cleanup. |

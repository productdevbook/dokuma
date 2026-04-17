## About

A notification queue. Each toast has a duration timer that pauses on hover/focus and when the document tab is hidden. The viewport is a single `role="region"` ARIA live region; individual toasts get `role="status"` (or `role="alert"` for `type: "error"`). Per-toast `action` slot for Undo/Retry. Animate-out is wired through the shared Presence primitive — toasts stay mounted until their CSS transition or animation finishes.

The Toaster manages **behavior**: queue, timers, ARIA, dismiss APIs. Rendering each toast inside the viewport is the consumer's job — subscribe to `toaster.toasts` and mirror the array into the DOM.

## Install

```bash
pnpm add dokuma
```

## Options

| Option       | Type                                                                                  | Notes                                                                       |
| ------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `duration`   | `number`                                                                              | Default `5000`. Per-toast `duration` overrides. `Infinity` is sticky.       |
| `maxToasts`  | `number`                                                                              | Default `Infinity`. Oldest is dismissed when the count exceeds the cap.     |
| `position`   | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| ... \| "bottom-right"` | Default `"bottom-right"`. Drives `data-position` on the viewport.           |
| `label`      | `string`                                                                              | Viewport `aria-label`. Default `"Notifications"`.                           |

### Per-toast options (passed to `add()`)

| Option         | Type                            | Notes                                                                  |
| -------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `id`           | `string`                        | Stable id; if omitted, generated. Re-using an id upserts in place.     |
| `type`         | `"default" \| "success" \| ...` | `"error"` switches the role to `"alert"`.                              |
| `duration`     | `number`                        | Per-toast override. `Infinity` keeps it open until manually dismissed. |
| `action`       | `{ label, onClick }`            | Optional action button. Click fires the handler then dismisses.        |
| `onDismiss`    | `() => void`                    | Fires when the toast is dismissed for any reason.                      |
| `onAutoClose`  | `() => void`                    | Fires only when the timer expires.                                     |

## Returns

| Member                 | Type                       | Notes                                                                           |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `toasts`               | `Signal<ToastItem[]>`      | Reactive list. Subscribe and re-render.                                         |
| `add(message, opts?)`  | `(...) => string`          | Push a toast; returns the id.                                                   |
| `dismiss(id)`          | `(id) => void`             | Trigger exit animation + removal.                                               |
| `dismissAll()`         | `() => void`               | Dismiss every visible toast.                                                    |
| `update(id, patch)`    | `(...) => void`            | Replace message or options in place.                                            |
| `getViewportProps()`   | `object`                   | `role="region"`, `aria-label`, `data-position`, `tabIndex=-1`.                  |
| `getToastProps(id)`    | `object`                   | `role`, `data-type`, `data-state`, hover/focus pause handlers, `tabIndex=0`.    |
| `getCloseProps(id)`    | `object`                   | Spread on the X button.                                                         |
| `getActionProps(id)`   | `object \| null`           | Returns null when the toast has no `action`.                                    |
| `mount(viewport)`      | `() => void`               | Imperative DOM wiring. Sets ARIA + installs `visibilitychange`. Returns cleanup.|

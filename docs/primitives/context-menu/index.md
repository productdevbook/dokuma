## About

A right-click menu (a.k.a. context menu) anchored to the cursor — not to a button. Composes the existing Menu primitive: it inherits roving focus, typeahead, Home/End, arrow navigation, Escape-to-close, and `aria-activedescendant`-free roving-tabindex. The only difference is the trigger surface: a `contextmenu` event on the anchor, plus a long-press gesture on touch (default 500ms, cancelled by movement >4px).

The menu opens at the cursor coordinates via a virtual anchor passed to the same `autoPosition` engine the rest of the floating primitives use, so flip + clamp work the same way. By default a `scroll` event closes the menu (matching native browser context menus); pass `closeOnScroll: false` to opt out.

Right-clicking again on the same anchor while the menu is already open re-positions it instantly without a close/open flash. The DismissibleLayer stack handles Escape correctly even when nested inside a Dialog.

## Install

```bash
pnpm add dokuma
```

## Options

| Option                | Type                   | Notes                                                              |
| --------------------- | ---------------------- | ------------------------------------------------------------------ |
| `defaultOpen`         | `boolean`              | Initial open state (uncontrolled).                                 |
| `open`                | `() => boolean`        | Controlled open getter.                                            |
| `onOpenChange`        | `(open) => void`       | Fires when open changes.                                           |
| `closeOnEscape`       | `boolean`              | Default `true`.                                                    |
| `closeOnOutsideClick` | `boolean`              | Default `true`. Mousedown outside content closes.                  |
| `closeOnSelect`       | `boolean`              | Default `true`.                                                    |
| `closeOnScroll`       | `boolean`              | Default `true`. First scroll event closes the menu.                |
| `loop`                | `boolean`              | Default `true`. Wrap arrow nav past ends.                          |
| `restoreFocus`        | `boolean`              | Default `true`. Returns focus to whatever was focused on close.    |
| `longPressThreshold`  | `number`               | Default `500` (ms). Touch long-press to open.                      |
| `side` / `align`      | from `PositionOptions` | Floating placement relative to cursor. Default `bottom` / `start`. |

## Returns

| Member                       | Type                      | Notes                                                                                                  |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `open`                       | `Signal<boolean>`         | Reactive open state.                                                                                   |
| `highlighted`                | `Signal<string>`          | Currently highlighted item value.                                                                      |
| `show / hide / toggle`       | `() => void`              | Open/close actions. Programmatic `show()` falls back to anchor's bbox if no cursor coord captured yet. |
| `select(value)`              | `(value) => void`         | Commit a selection.                                                                                    |
| `setHighlighted(value)`      | `(value) => void`         | Programmatic highlight.                                                                                |
| `registerItem(value, opts?)` | `(...) => MenuItemHandle` | Idempotent re-registration.                                                                            |
| `getAnchorProps()`           | `object`                  | Spread on the right-clickable region.                                                                  |
| `getContentProps()`          | `object`                  | Spread on the menu container.                                                                          |
| `getItemProps(value)`        | `object`                  | Spread on each menu item button.                                                                       |
| `mount({ anchor, content })` | `() => void`              | Imperative DOM wiring. Returns cleanup.                                                                |

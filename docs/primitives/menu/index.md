## About

A click-triggered menu of actions. `role="menu"`, items are `role="menuitem"`. Action semantics — items are _invoked_, not _selected_ (for selection within a form, use a Listbox / Combobox primitive — coming later).

Keyboard contract:

- Trigger: `Enter`/`Space`/`ArrowDown` opens and focuses first item; `ArrowUp` opens and focuses last item.
- Inside the menu: `ArrowDown`/`ArrowUp` to navigate (loops by default), `Home`/`End` jump to first/last, `Enter`/`Space` selects, `Escape` closes (returns focus to trigger), `Tab` closes (focus advances naturally), printable keys do **typeahead**.
- Disabled items are skipped during arrow navigation.

Submenus are not yet supported.

## Install

```bash
pnpm add dokuma
```

## Options

| Option                                                                   | Type             | Notes                                     |
| ------------------------------------------------------------------------ | ---------------- | ----------------------------------------- |
| `defaultOpen`                                                            | `boolean`        | Initial state for uncontrolled mode.      |
| `open`                                                                   | `() => boolean`  | Controlled getter.                        |
| `onOpenChange`                                                           | `(open) => void` | Fires on open/close.                      |
| `closeOnEscape`                                                          | `boolean`        | Default `true`.                           |
| `closeOnOutsideClick`                                                    | `boolean`        | Default `true`. Mousedown outside closes. |
| `closeOnSelect`                                                          | `boolean`        | Default `true`. Closes after `select()`.  |
| `loop`                                                                   | `boolean`        | Default `true`.                           |
| `restoreFocus`                                                           | `boolean`        | Default `true`. Returns focus to trigger. |
| `side`, `align`, `sideOffset`, `alignOffset`, `flip`, `collisionPadding` | (positioning)    | Same shape as Popover.                    |

## Item options

| Option     | Type            | Notes                                                   |
| ---------- | --------------- | ------------------------------------------------------- |
| `disabled` | `() => boolean` | When true, the item cannot be selected; arrows skip it. |
| `onSelect` | `() => void`    | Called when the item is selected (click, Enter, Space). |
| `label`    | `string`        | Optional label for typeahead (falls back to `value`).   |

## Returns

| Member                        | Type              | Notes                                   |
| ----------------------------- | ----------------- | --------------------------------------- |
| `open`                        | `Signal<boolean>` | Reactive state.                         |
| `show/hide/toggle`            | `() => void`      | Actions.                                |
| `highlighted`                 | `Signal<string>`  | Currently focused item value.           |
| `select(value)`               | `(value) => void` | Programmatic select.                    |
| `registerItem(value, opts?)`  | `() => Handle`    | Returns `{ itemId, unregister }`.       |
| `getTriggerProps()`           | `object`          | Spread on the trigger button.           |
| `getContentProps()`           | `object`          | Spread on the menu container.           |
| `getItemProps(value)`         | `object`          | Spread on each menu item button.        |
| `mount({ trigger, content })` | `() => void`      | Imperative DOM wiring. Returns cleanup. |

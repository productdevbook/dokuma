## About

A searchable single-select. The input is the focus target; arrow keys navigate the listbox via `aria-activedescendant` (WAI-ARIA 1.2 modern combobox pattern — focus never leaves the input). Type to filter, Enter to commit, Escape to revert and close. Outside-click closes via the shared `DismissibleLayer` stack so a Combobox inside a Dialog Escapes correctly. Floating positioning shares the same `autoPosition` engine as Popover and Menu.

The default filter is case-insensitive substring match on each option's `label`. Pass `filter` to override (fuzzy, fzy, async — your call). For async data, the consumer manages the registered items dynamically; the primitive handles ARIA, highlight, and keyboard.

## Install

```bash
pnpm add dokuma
```

## Options

| Option               | Type                        | Notes                                                            |
| -------------------- | --------------------------- | ---------------------------------------------------------------- |
| `defaultValue`       | `string`                    | Initial committed value (uncontrolled).                          |
| `value`              | `() => string`              | Controlled value getter.                                         |
| `onValueChange`      | `(value) => void`           | Fires when a selection commits.                                  |
| `defaultOpen`        | `boolean`                   | Initial open state.                                              |
| `open`               | `() => boolean`             | Controlled open getter.                                          |
| `onOpenChange`       | `(open) => void`            | Fires when open changes.                                         |
| `filter`             | `(label, query) => boolean` | Default case-insensitive substring on label.                     |
| `closeOnSelect`      | `boolean`                   | Default `true`.                                                  |
| `allowCustomValue`   | `boolean`                   | Default `false`. On blur, accept whatever is typed as the value. |
| `autoHighlightFirst` | `boolean`                   | Default `false`. Auto-highlight the first filtered item on type. |
| `loop`               | `boolean`                   | Default `true`. Wrap on Arrow nav past the ends.                 |
| `name`               | `string`                    | Form input name for hidden submit input.                         |
| `disabled`           | `() => boolean`             | Root-level disable.                                              |
| `side` / `align`     | from `PositionOptions`      | Floating position. Default `bottom` / `start`.                   |

## Returns

| Member                                | Type               | Notes                                                        |
| ------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `open`                                | `Signal<boolean>`  | Reactive open state.                                         |
| `value`                               | `Signal<string>`   | Reactive committed value.                                    |
| `query`                               | `Signal<string>`   | Reactive search text. Set externally to drive async fetches. |
| `highlighted`                         | `Signal<string>`   | The option currently aria-activedescendant'd.                |
| `filteredItems`                       | `Signal<string[]>` | Read-only — derived from `query` + registered items.         |
| `isEmpty`                             | `Signal<boolean>`  | True when filter returns nothing.                            |
| `show / hide / toggle`                | `() => void`       | Open/close actions.                                          |
| `select(value)`                       | `(value) => void`  | Commit a selection.                                          |
| `setHighlighted(value)`               | `(value) => void`  | Programmatic highlight.                                      |
| `registerItem(value, opts?)`          | `(...) => Handle`  | Returns `{ itemId, unregister }`. Idempotent on re-register. |
| `getInputProps()`                     | `object`           | Spread on the `<input>`.                                     |
| `getListboxProps()`                   | `object`           | Spread on the listbox container.                             |
| `getOptionProps(value)`               | `object`           | Spread on each option element.                               |
| `getTriggerProps()`                   | `object`           | Optional chevron button.                                     |
| `getHiddenInputProps()`               | `object \| null`   | Hidden `<input type="hidden">` for forms.                    |
| `mount({ input, listbox, trigger? })` | `() => void`       | Imperative DOM wiring. Returns cleanup.                      |

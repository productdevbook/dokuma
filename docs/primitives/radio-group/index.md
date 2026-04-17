## About

A group of radio buttons. `role="radiogroup"` on root, `role="radio"` on each item with `aria-checked="true|false"`. Single-selection, controlled or uncontrolled. Roving tabindex (only the checked radio is in tab order). Per WAI-ARIA, **arrow keys both navigate AND select** — that's how radio groups feel "right".

## Install

```bash
pnpm add dokuma
```

## Options

| Option            | Type                         | Notes                                                         |
| ----------------- | ---------------------------- | ------------------------------------------------------------- |
| `defaultValue`    | `string`                     | Initial selected value.                                       |
| `value`           | `() => string`               | Controlled getter.                                            |
| `onValueChange`   | `(value) => void`            | Fires on every change.                                        |
| `orientation`     | `"horizontal" \| "vertical"` | Default `"vertical"`. Decides which arrow keys navigate.      |
| `loop`            | `boolean`                    | Default `true`. Arrow navigation wraps.                       |
| `disabled`        | `() => boolean`              | Root-level disable.                                           |
| `required`        | `boolean`                    | Adds `aria-required` and propagates to the hidden form input. |
| `name`            | `string`                     | Form input name.                                              |
| `aria-label`      | `string`                     | Optional label for the group.                                 |
| `aria-labelledby` | `string`                     | References an element that labels the group.                  |

## Returns

| Member                       | Type              | Notes                                                 |
| ---------------------------- | ----------------- | ----------------------------------------------------- |
| `value`                      | `Signal<string>`  | Reactive state.                                       |
| `select(value)`              | `(value) => void` | Action.                                               |
| `registerItem(value, opts?)` | `() => Handle`    | Returns `{ itemId, unregister }`.                     |
| `getRootProps()`             | `object`          | Spread on the radiogroup wrapper.                     |
| `getItemProps(value)`        | `object`          | Spread on each radio button.                          |
| `getHiddenInputProps(value)` | `object \| null`  | Hidden form radio. Returns null without `name`.       |
| `mount(root)`                | `() => void`      | Auto-discovers `[data-dokuma-radio="<value>"]` items. |

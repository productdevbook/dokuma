## About

A coordinated set of Toggle buttons. `single` mode = exclusive (alignment: left/center/right). `multiple` = independent (formatting: B/I/U). Roving tabindex by default — only the focused item is in tab order; arrow keys navigate.

Items use `aria-pressed`, never `aria-checked` or `aria-selected`. Root uses `role="group"` so it stays honest about what keyboard contract it actually implements.

## Install

```bash
pnpm add dokuma
```

## Options

| Option            | Type                         | Notes                                                                         |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `type`            | `"single" \| "multiple"`     | Default `"single"`. Locked at construction.                                   |
| `defaultValue`    | `string \| string[]`         | Initial pressed item(s) for uncontrolled mode.                                |
| `value`           | `() => string \| string[]`   | Controlled value getter.                                                      |
| `onValueChange`   | `(value) => void`            | Fires on every state change.                                                  |
| `collapsible`     | `boolean`                    | `single` mode only — allow unpressing the only pressed item. Default `false`. |
| `rovingFocus`     | `boolean`                    | Default `true`. Only the focused item is in tab order.                        |
| `loop`            | `boolean`                    | Default `true`. Arrow navigation wraps.                                       |
| `orientation`     | `"horizontal" \| "vertical"` | Default `"horizontal"`. Decides which arrow keys navigate.                    |
| `disabled`        | `() => boolean`              | Root-level disable. ORs with per-item `disabled`.                             |
| `aria-label`      | `string`                     | Optional. Labels the group for screen readers.                                |
| `aria-labelledby` | `string`                     | Optional. References an element that labels the group.                        |

## Returns

| Member                       | Type                  | Notes                                                             |
| ---------------------------- | --------------------- | ----------------------------------------------------------------- |
| `values`                     | `Signal<string[]>`    | Pressed values, normalized to array.                              |
| `registerItem(value, opts?)` | `() => Handle`        | Returns `{ itemId, unregister }`.                                 |
| `hasItem(value)`             | `(string) => boolean` | Lookup helper.                                                    |
| `isPressed(value)`           | `(string) => boolean` | Lookup helper.                                                    |
| `toggle/press/unpress`       | `(value) => void`     | Actions. No-op while disabled.                                    |
| `setFocused(value)`          | `(value) => void`     | Mark an item as the current tab stop (used by adapters on focus). |
| `getRootProps()`             | `object`              | Spread on the wrapping element.                                   |
| `getItemProps(value)`        | `object`              | Spread on each button. Includes `onKeyDown`.                      |
| `mount(rootEl)`              | `() => void`          | Vanilla DOM auto-discovery. Returns cleanup.                      |

## Vanilla auto-discovery

`mount(root)` scans for `[data-dokuma-toggle-group-item="<value>"]` descendants.

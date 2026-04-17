## About

A progressbar with proper ARIA wiring. `value: number | null`; `null` means indeterminate. State data attribute follows: `indeterminate | loading | complete`. Width is exposed as a CSS-friendly inline style on the indicator.

## Install

```bash
pnpm add dokuma
```

## Options

| Option          | Type                     | Notes                                              |
| --------------- | ------------------------ | -------------------------------------------------- |
| `defaultValue`  | `number \| null`         | Initial value. `null` = indeterminate.             |
| `value`         | `() => number \| null`   | Controlled getter.                                 |
| `max`           | `number`                 | Default `100`.                                     |
| `getValueLabel` | `(value, max) => string` | Default `"<percent>%"`. Used for `aria-valuetext`. |
| `onValueChange` | `(value) => void`        | Fires on every change.                             |

## Returns

| Member                        | Type                     | Notes                                                  |
| ----------------------------- | ------------------------ | ------------------------------------------------------ |
| `value`                       | `Signal<number \| null>` | Reactive state.                                        |
| `max`                         | `number`                 | Resolved max.                                          |
| `fraction()`                  | `() => number \| null`   | 0..1 ratio, or `null` when indeterminate.              |
| `getRootProps()`              | `object`                 | Spread on the bar root.                                |
| `getIndicatorProps()`         | `object`                 | Spread on the inner indicator. Includes `style.width`. |
| `mount({ root, indicator? })` | `() => void`             | Imperative DOM wiring. Returns cleanup.                |

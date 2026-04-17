## About

A stepper input with min / max / step / precision, hold-to-repeat on the +/− buttons (`500ms` initial delay then `50ms` interval), `clampValueOnBlur`, custom `format` / `parse`, optional mouse-wheel support, and a hidden form input. ARIA `role="spinbutton"` with full `aria-value*` attributes.

The primitive doesn't parse or format aggressively while the user is typing — it accepts intermediate states (`""`, `"-"`, `"1.0"`) and only commits a clean numeric value on blur or via the step buttons.

## Install

```bash
pnpm add dokuma
```

## Options

| Option                  | Type                                | Notes                                                 |
| ----------------------- | ----------------------------------- | ----------------------------------------------------- |
| `defaultValue`          | `number \| null`                    | Initial value (uncontrolled).                         |
| `value`                 | `() => number \| null`              | Controlled value getter.                              |
| `onValueChange`         | `(v) => void`                       | Fires on every change (including in-progress typing). |
| `onValueCommit`         | `(v) => void`                       | Fires on blur and on step button release.             |
| `min` / `max`           | `number`                            | Bounds applied on commit.                             |
| `step`                  | `number`                            | Default `1`.                                          |
| `precision`             | `number`                            | Decimal places. Inferred from `step` when omitted.    |
| `format` / `parse`      | `(n)=>string` / `(s)=>number\|null` | Custom render / read. Defaults handle plain numbers.  |
| `allowMouseWheel`       | `boolean`                           | Default `false`.                                      |
| `clampValueOnBlur`      | `boolean`                           | Default `true`.                                       |
| `name`                  | `string`                            | Optional form input name for hidden submit input.     |
| `disabled` / `readOnly` | `() => boolean`                     | Standard reactive disable / read-only.                |

## Returns

| Member                                        | Type                     | Notes                                                        |
| --------------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| `value`                                       | `Signal<number \| null>` | Reactive numeric value.                                      |
| `inputValue`                                  | `Signal<string>`         | Reactive raw text in the field.                              |
| `increment / decrement`                       | `() => void`             | Step actions.                                                |
| `setValue(v)`                                 | `(v) => void`            | Programmatic set.                                            |
| `getRootProps()`                              | `object`                 | Spread on the wrapping `<div role="group">`.                 |
| `getInputProps()`                             | `object`                 | Spread on the `<input>`.                                     |
| `getIncrementProps()` / `getDecrementProps()` | `object`                 | Spread on the +/− buttons.                                   |
| `getHiddenInputProps()`                       | `object \| null`         | Hidden `<input type="hidden">` for forms when `name` is set. |

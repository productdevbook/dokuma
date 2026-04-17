## About

A `role="checkbox"` button with three states: `false`, `true`, and `"indeterminate"`. Per WAI-ARIA, `aria-checked="true|false|mixed"` (string token, never boolean). Clicking an indeterminate checkbox sets it to `true`. Optional hidden `<input type="checkbox">` for form submission — note that **indeterminate is a UI state and submits as `false`**.

## Install

```bash
pnpm add dokuma
```

## Options

| Option            | Type                         | Notes                                                                |
| ----------------- | ---------------------------- | -------------------------------------------------------------------- |
| `defaultChecked`  | `boolean \| "indeterminate"` | Initial state.                                                       |
| `checked`         | `() => CheckedState`         | Controlled getter.                                                   |
| `onCheckedChange` | `(checked) => void`          | Fires on every change.                                               |
| `disabled`        | `() => boolean`              | While true, all actions are no-ops.                                  |
| `required`        | `boolean`                    | Adds `aria-required` and propagates to the hidden form input.        |
| `name`            | `string`                     | Form input name. Without this, `getHiddenInputProps()` returns null. |
| `value`           | `string`                     | Submit value when checked. Default `"on"`.                           |

## Returns

| Member                                  | Type                   | Notes                                                  |
| --------------------------------------- | ---------------------- | ------------------------------------------------------ |
| `checked`                               | `Signal<CheckedState>` | Reactive state.                                        |
| `toggle/check/uncheck/setIndeterminate` | `() => void`           | Actions. No-op while disabled.                         |
| `getRootProps()`                        | `object`               | Spread on the `<button>`.                              |
| `getIndicatorProps()`                   | `object`               | Spread on the inner indicator. `hidden` flag included. |
| `getHiddenInputProps()`                 | `object \| null`       | Spread on a hidden checkbox for form submit.           |
| `mount({ root, hiddenInput? })`         | `() => void`           | Imperative DOM wiring. Returns cleanup.                |

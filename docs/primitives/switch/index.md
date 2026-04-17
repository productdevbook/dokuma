## About

A two-state on/off control. Renders as a `<button role="switch">` with `aria-checked="true"|"false"`. Native button keyboard handling (Space and Enter) toggles for free — no `onKeyDown` from the primitive. Optional hidden `<input type="checkbox">` companion for form submission when `name` is provided.

Switch is for binary settings ("Wi-Fi: on/off"). For accept/reject in a form, use a Checkbox.

## Install

```bash
pnpm add dokuma
```

## Options

| Option            | Type                | Notes                                                                  |
| ----------------- | ------------------- | ---------------------------------------------------------------------- |
| `defaultChecked`  | `boolean`           | Initial state for uncontrolled mode. Default `false`.                  |
| `checked`         | `() => boolean`     | Controlled checked getter. Internal state bypassed.                    |
| `onCheckedChange` | `(checked) => void` | Fires on every state change.                                           |
| `disabled`        | `() => boolean`     | While true, `toggle/check/uncheck` are no-ops.                         |
| `required`        | `boolean`           | Adds `aria-required` and propagates to the hidden form input.          |
| `name`            | `string`            | Form input name. Without this, `getHiddenInputProps()` returns `null`. |
| `value`           | `string`            | Submit value when checked. Default `"on"`.                             |

## Returns

| Member                          | Type              | Notes                                                   |
| ------------------------------- | ----------------- | ------------------------------------------------------- |
| `checked`                       | `Signal<boolean>` | Reactive state. `get/set/subscribe`.                    |
| `toggle/check/uncheck`          | `() => void`      | Actions. No-op while disabled.                          |
| `getRootProps()`                | `object`          | Spread on the `<button>` element.                       |
| `getThumbProps()`               | `object`          | Spread on the inner thumb (CSS hooks only).             |
| `getHiddenInputProps()`         | `object \| null`  | Spread on a hidden `<input type="checkbox">` for forms. |
| `mount({ root, hiddenInput? })` | `() => void`      | Imperative DOM wiring. Returns cleanup.                 |

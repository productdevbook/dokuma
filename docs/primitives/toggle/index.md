## About

A two-state button. Renders as `<button aria-pressed="true|false">`. Use Toggle for actions where the control reflects an applied state — "Bold", "Mute", "Italic". For settings that get submitted in a form, use Switch instead.

## Install

```bash
pnpm add dokuma
```

## Options

| Option            | Type                | Notes                                          |
| ----------------- | ------------------- | ---------------------------------------------- |
| `defaultPressed`  | `boolean`           | Initial state for uncontrolled mode.           |
| `pressed`         | `() => boolean`     | Controlled getter. Internal state bypassed.    |
| `onPressedChange` | `(pressed) => void` | Fires on every state change.                   |
| `disabled`        | `() => boolean`     | While true, `toggle/press/unpress` are no-ops. |

## Returns

| Member                 | Type              | Notes                                   |
| ---------------------- | ----------------- | --------------------------------------- |
| `pressed`              | `Signal<boolean>` | Reactive state.                         |
| `toggle/press/unpress` | `() => void`      | Actions. No-op while disabled.          |
| `getRootProps()`       | `object`          | Spread on the `<button>` element.       |
| `mount(root)`          | `() => void`      | Imperative DOM wiring. Returns cleanup. |

## About

Wires up `aria-expanded`, `aria-controls`, a focusable trigger, and the `hidden` attribute on the panel. Supports controlled, uncontrolled, and disabled modes. Same primitive in every adapter — only the integration glue changes.

## Install

```bash
pnpm add dokuma
```

## Options

| Option         | Type             | Notes                                                       |
| -------------- | ---------------- | ----------------------------------------------------------- |
| `defaultOpen`  | `boolean`        | Initial state for uncontrolled mode. Default `false`.       |
| `open`         | `() => boolean`  | Controlled mode. When provided, internal state is bypassed. |
| `onOpenChange` | `(open) => void` | Fires on every state change.                                |
| `disabled`     | `() => boolean`  | While true, `toggle/show/hide` are no-ops.                  |
| `panelId`      | `string`         | Override the auto-generated panel id.                       |

## Returns

| Member                      | Type              | Notes                                   |
| --------------------------- | ----------------- | --------------------------------------- |
| `open`                      | `Signal<boolean>` | Reactive state. `get/set/subscribe`.    |
| `toggle` / `show` / `hide`  | `() => void`      | Actions. No-op while disabled.          |
| `getTriggerProps()`         | `object`          | Spread on the trigger button.           |
| `getPanelProps()`           | `object`          | Spread on the panel.                    |
| `mount({ trigger, panel })` | `() => void`      | Imperative DOM wiring. Returns cleanup. |

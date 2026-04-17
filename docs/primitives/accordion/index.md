## About

A vertically stacked set of headers that each reveal a panel. Built on the same primitive shape as `Disclosure`, with a coordinator that owns the open set. Supports `single` (one panel at a time) and `multiple` (any number open) modes, controlled and uncontrolled, per-item disable, and arrow-key navigation between triggers.

## Install

```bash
pnpm add dokuma
```

## Options

| Option          | Type                         | Notes                                                              |
| --------------- | ---------------------------- | ------------------------------------------------------------------ |
| `type`          | `"single" \| "multiple"`     | Default `"single"`. Locked at construction.                        |
| `defaultValue`  | `string \| string[]`         | Initial open value(s) for uncontrolled mode.                       |
| `value`         | `() => string \| string[]`   | Controlled value getter. When set, internal state is bypassed.     |
| `onValueChange` | `(value) => void`            | Fires when the open set changes.                                   |
| `collapsible`   | `boolean`                    | `single` mode only — allow closing the open item. Default `false`. |
| `disabled`      | `() => boolean`              | Root-level disable. ORs with per-item `disabled`.                  |
| `orientation`   | `"vertical" \| "horizontal"` | Default `"vertical"`. Affects which arrow keys move focus.         |

## Returns

| Member                             | Type                  | Notes                                                  |
| ---------------------------------- | --------------------- | ------------------------------------------------------ |
| `values`                           | `Signal<string[]>`    | Open values, normalized to array. `get/set/subscribe`. |
| `registerItem(value, opts?)`       | `() => ItemHandle`    | Returns `{ triggerId, panelId, unregister }`.          |
| `hasItem(value)` / `isOpen(value)` | `(string) => boolean` | Lookup helpers.                                        |
| `open` / `close` / `toggle`        | `(value) => void`     | Actions. No-op while disabled.                         |
| `getRootProps()`                   | `object`              | Spread on the wrapping element.                        |
| `getItemProps(value)`              | `object`              | Spread on each item element.                           |
| `getTriggerProps(value)`           | `object`              | Spread on each trigger button. Includes `onKeyDown`.   |
| `getPanelProps(value)`             | `object`              | Spread on each panel.                                  |
| `mount(rootEl)`                    | `() => void`          | Vanilla DOM auto-discovery. Returns cleanup.           |

## Vanilla auto-discovery

`mount(root)` scans for `[data-dokuma-accordion-item="<value>"]` children. Inside each item it looks for one `[data-dokuma-accordion-trigger]` and one `[data-dokuma-accordion-panel]`. Everything else (styling, content) is yours.

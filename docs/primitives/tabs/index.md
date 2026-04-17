## About

A tablist with roving focus. Selected tab keeps `tabIndex=0`; others get `-1` so `Tab` exits the tablist into the active panel. Arrow keys navigate within the list (orientation-aware), `Home`/`End` jump to first/last enabled tab, `Space`/`Enter` activate. Disabled tabs are skipped during arrow navigation.

In `automatic` mode (default) arrow navigation also selects. In `manual` mode, arrows only move focus and the user confirms with `Space`/`Enter`.

## Install

```bash
pnpm add dokuma
```

## Options

| Option           | Type                         | Notes                                                                          |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `defaultValue`   | `string`                     | Initial selected tab. If omitted, the first non-disabled tab is auto-selected. |
| `value`          | `() => string`               | Controlled value getter. When set, internal state is bypassed.                 |
| `onValueChange`  | `(value) => void`            | Fires on selection change.                                                     |
| `orientation`    | `"horizontal" \| "vertical"` | Default `"horizontal"`. Decides which arrow keys navigate.                     |
| `activationMode` | `"automatic" \| "manual"`    | Default `"automatic"`. See above.                                              |
| `loop`           | `boolean`                    | Default `true`. Arrow navigation wraps at the ends.                            |
| `disabled`       | `() => boolean`              | Root-level disable. ORs with per-tab `disabled`.                               |

## Returns

| Member                      | Type                  | Notes                                            |
| --------------------------- | --------------------- | ------------------------------------------------ |
| `value`                     | `Signal<string>`      | Selected tab. `get/set/subscribe`.               |
| `registerTab(value, opts?)` | `() => TabHandle`     | Returns `{ tabId, panelId, unregister }`.        |
| `hasTab(value)`             | `(string) => boolean` | Lookup helper.                                   |
| `isSelected(value)`         | `(string) => boolean` | Lookup helper.                                   |
| `select(value)`             | `(string) => void`    | Select. No-op when disabled.                     |
| `getRootProps()`            | `object`              | Spread on the wrapping element.                  |
| `getListProps()`            | `object`              | Spread on the tablist element.                   |
| `getTabProps(value)`        | `object`              | Spread on each tab button. Includes `onKeyDown`. |
| `getPanelProps(value)`      | `object`              | Spread on each panel.                            |
| `mount(rootEl)`             | `() => void`          | Vanilla DOM auto-discovery. Returns cleanup.     |

## Vanilla auto-discovery

`mount(root)` scans for `[data-dokuma-tabs-tab="<value>"]` (in any descendant) and `[data-dokuma-tabs-panel="<value>"]`. The optional `[data-dokuma-tabs-list]` element gets `role=tablist` automatically.

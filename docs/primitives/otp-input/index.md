## About

An N-cell pin / one-time-code input. Behaviors: auto-advance focus on type, backspace-clears-and-moves-back, paste distributes characters across cells, arrow keys navigate between cells. Optional `mask` renders cells as `type="password"`. Custom `pattern` regex char-class restricts which characters are accepted (default `[0-9]` for numeric codes; pass `"a-zA-Z0-9"` for alphanumeric).

`isComplete: Signal<boolean>` is exposed alongside `value` so consumers can reactively gate a submit button without subscribing to `value` and counting characters.

## Install

```bash
pnpm add dokuma
```

## Options

| Option          | Type            | Notes                                                          |
| --------------- | --------------- | -------------------------------------------------------------- |
| `length`        | `number`        | Default `6`. Number of cells.                                  |
| `defaultValue`  | `string`        | Initial value (uncontrolled). Clipped to `length`.             |
| `value`         | `() => string`  | Controlled value getter.                                       |
| `onValueChange` | `(v) => void`   | Fires on every cell change.                                    |
| `onComplete`    | `(v) => void`   | Fires once when all cells are filled.                          |
| `mask`          | `boolean`       | Default `false`. When true, cells render as `type="password"`. |
| `pattern`       | `string`        | Default `"0-9"`. Regex char-class (no anchors / brackets).     |
| `name`          | `string`        | Optional form input name for hidden submit input.              |
| `disabled`      | `() => boolean` | Standard reactive disable.                                     |

## Returns

| Member                  | Type              | Notes                                                        |
| ----------------------- | ----------------- | ------------------------------------------------------------ |
| `value`                 | `Signal<string>`  | Joined value across all cells.                               |
| `isComplete`            | `Signal<boolean>` | True when all cells are filled.                              |
| `length`                | `number`          | Echoes the resolved length.                                  |
| `setValue(v) / clear()` | `() => void`      | Imperative actions.                                          |
| `getCellProps(i)`       | `object`          | Spread on each cell `<input>`.                               |
| `getCellId(i)`          | `string`          | Stable id for cell `i`. Used by the primitive's focus logic. |
| `getHiddenInputProps()` | `object \| null`  | Hidden `<input type="hidden">` for forms when `name` is set. |

## About

`role="slider"` with viewport-aware thumb positioning. Single value or range (two thumbs). Pointer drag with `setPointerCapture`, full keyboard support (Arrows step, Shift+Arrow / PageUp/PageDown for large step, Home/End jump, orientation-aware), `pointercancel` for mobile, `document.body` cursor lock during drag.

For range mode, the two thumbs **clamp** (start cannot exceed end). Step snapping is "round to nearest valid step from `min`".

## Install

```bash
pnpm add dokuma
```

## Options

| Option          | Type                               | Notes                                                             |
| --------------- | ---------------------------------- | ----------------------------------------------------------------- |
| `defaultValue`  | `number \| [number, number]`       | Number for single thumb, tuple for range. Range mode is inferred. |
| `value`         | `() => number \| [number, number]` | Controlled getter.                                                |
| `onValueChange` | `(value) => void`                  | Fires on every value change.                                      |
| `onValueCommit` | `(value) => void`                  | Fires on pointerup / key release. For form submit logic.          |
| `min`           | `number`                           | Default `0`.                                                      |
| `max`           | `number`                           | Default `100`.                                                    |
| `step`          | `number`                           | Default `1`.                                                      |
| `largeStep`     | `number`                           | Default `step * 10`. Used by Shift+Arrow / PageUp / PageDown.     |
| `range`         | `boolean`                          | Override the inferred mode if needed.                             |
| `orientation`   | `"horizontal" \| "vertical"`       | Default `"horizontal"`.                                           |
| `inverted`      | `boolean`                          | Reverse the visual direction.                                     |
| `dir`           | `"ltr" \| "rtl"`                   | Default `"ltr"`. XOR'd with `inverted`.                           |
| `disabled`      | `() => boolean`                    |                                                                   |
| `name`          | `string`                           | Form input name. Range mode emits `name.0` and `name.1`.          |
| `getValueText`  | `(v, thumbIdx) => string`          | Custom `aria-valuetext` per thumb. Default `String(value)`.       |

## Returns

| Member                                   | Type                         | Notes                                                          |
| ---------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| `value`                                  | `Signal<SliderValue>`        | Reactive state.                                                |
| `setValue(v)`                            | `() => void`                 | Programmatic update (clamp + snap).                            |
| `setThumbValue(idx, v)`                  | `() => void`                 | Range mode: update one thumb (`0`=start, `1`=end).             |
| `getRootProps()`                         | `object`                     | Spread on the wrapping element.                                |
| `getTrackProps()`                        | `object`                     | Spread on the track (drag area).                               |
| `getRangeProps()`                        | `object`                     | Spread on the visual fill. Includes `style` with left+width.   |
| `getThumbProps(idx?)`                    | `object`                     | Spread on each thumb. Includes `style` with absolute position. |
| `getHiddenInputProps()`                  | `object \| object[] \| null` | Hidden form input(s). Single or tuple per range mode.          |
| `mount({ root, track, range?, thumbs })` | `() => void`                 | Imperative DOM wiring with full pointer + keyboard.            |

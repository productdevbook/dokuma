## About

An image with a fallback. Status flows through `idle → loading → loaded | error`. Eager preload (browser only) so the fallback shows while the network fetch is in flight, then swaps to the image when it lands.

## Install

```bash
pnpm add dokuma
```

## Options

| Option           | Type                                     | Notes                                           |
| ---------------- | ---------------------------------------- | ----------------------------------------------- |
| `src`            | `string`                                 | Image URL. When omitted, status stays `"idle"`. |
| `crossOrigin`    | `"anonymous" \| "use-credentials" \| ""` | Mirrors the `<img>` attribute.                  |
| `referrerPolicy` | `ReferrerPolicy`                         | Mirrors the `<img>` attribute.                  |
| `onStatusChange` | `(status) => void`                       | Fires whenever status changes.                  |

## Returns

| Member                        | Type                   | Notes                                                 |
| ----------------------------- | ---------------------- | ----------------------------------------------------- |
| `status`                      | `Signal<AvatarStatus>` | Reactive state.                                       |
| `getImageProps(alt?)`         | `object`               | Spread on an `<img>`. Hidden until `loaded`.          |
| `getFallbackProps()`          | `object`               | Spread on the fallback element. Hidden when `loaded`. |
| `mount({ image, fallback? })` | `() => void`           | Imperative DOM wiring. Returns cleanup.               |

## About

Constrains a child to a specific width/height ratio via the modern `aspect-ratio` CSS property (97%+ browser support, no padding-bottom hack needed). Stateless. Use when the child is an image, iframe, video, or canvas whose intrinsic size differs from the desired layout slot.

## Install

```bash
pnpm add dokuma
```

## Options

| Option  | Type     | Notes                                       |
| ------- | -------- | ------------------------------------------- |
| `ratio` | `number` | Width / height ratio. Default `1` (square). |

## Returns

| Member           | Type                                | Notes                                              |
| ---------------- | ----------------------------------- | -------------------------------------------------- |
| `ratio`          | `number`                            | Echoes the resolved ratio.                         |
| `getRootProps()` | `{ style: { aspectRatio, width } }` | Spread on the wrapping element. `width` is `100%`. |

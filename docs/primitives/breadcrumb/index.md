## About

Pure ARIA wrapper for a breadcrumb trail. The primitive does not own the items list — the caller renders `<li>` elements directly. The current page item gets `aria-current="page"`; separators (`/`, `›`, etc.) are marked decorative so screen readers don't announce them between every step.

Use `<nav>` for the root and `<ol>` for the list; the WAI-ARIA pattern recommends an ordered list because order matters.

## Install

```bash
pnpm add dokuma
```

## Options

| Option  | Type     | Notes                                        |
| ------- | -------- | -------------------------------------------- |
| `label` | `string` | Default `"Breadcrumb"`. Set when localizing. |

## Returns

| Member                       | Type     | Notes                                                                |
| ---------------------------- | -------- | -------------------------------------------------------------------- |
| `getRootProps()`             | `object` | Spread on the `<nav>`. `role` + `aria-label`.                        |
| `getListProps()`             | `object` | Spread on the `<ol>`. Empty marker for parity.                       |
| `getItemProps({ current? })` | `object` | Spread on the link/span. `aria-current="page"` when `current: true`. |
| `getSeparatorProps()`        | `object` | Spread on the separator `<li>`. `aria-hidden + role="presentation"`. |

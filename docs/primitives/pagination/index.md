## About

A page-list manager with the standard ellipsis-collapse algorithm. Computes the visible page array (`[1, "ellipsis", 9, 10, 11, "ellipsis", 20]`) from the current page, sibling count, and boundary count; emits an `aria-current="page"` on the active item; provides next/prev step props with `disabled` at the boundaries.

The primitive owns no DOM — render `<button>`s yourself by iterating `pagination.pages.get()`. Subscribe to `pagination.page` to re-render on change (or use the `useXxx` hook in your adapter, which wires that for you).

## Install

```bash
pnpm add dokuma
```

## Options

| Option          | Type           | Notes                                                      |
| --------------- | -------------- | ---------------------------------------------------------- |
| `pageCount`     | `number`       | Required. Total number of pages.                           |
| `defaultPage`   | `number`       | Initial page (1-indexed). Default `1`.                     |
| `page`          | `() => number` | Controlled page getter.                                    |
| `onPageChange`  | `(n) => void`  | Fires when the page commits.                               |
| `siblingCount`  | `number`       | Default `1`. Pages shown on each side of the current page. |
| `boundaryCount` | `number`       | Default `1`. Pages shown at each boundary (start / end).   |

## Returns

| Member                                 | Type                                | Notes                            |
| -------------------------------------- | ----------------------------------- | -------------------------------- |
| `page`                                 | `Signal<number>`                    | Current page.                    |
| `pages`                                | `Signal<Array<number\|"ellipsis">>` | Visible items in render order.   |
| `pageCount`                            | `number`                            | Echoes the resolved count.       |
| `canGoPrev` / `canGoNext`              | `Signal<boolean>`                   | Reactive boundary state.         |
| `setPage / next / prev / first / last` | `() => void`                        | Imperative actions, all clamped. |
| `getRootProps()`                       | `object`                            | Spread on `<nav>`.               |
| `getItemProps(n)`                      | `object`                            | Spread on a page button.         |
| `getPrevProps()` / `getNextProps()`    | `object`                            | Spread on the step buttons.      |

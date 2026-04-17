## About

A `<label>` association helper. The primitive doesn't render a `<label>` itself — the consumer does — and only emits the `for` and `id` attributes so screen-reader pairings stay correct. Useful when the label points to a non-`<input>` widget (a custom Switch, a Checkbox composite) where wrapping with `<label>` doesn't auto-associate.

> The DOM attribute is `for`. React renames it to `htmlFor` in JSX; Vue keeps `for`. The primitive emits `for` and lets the adapter handle the rename.

## Install

```bash
pnpm add dokuma
```

## Options

| Option    | Type     | Notes                                              |
| --------- | -------- | -------------------------------------------------- |
| `htmlFor` | `string` | The `id` of the form control this label describes. |
| `id`      | `string` | Optional id on the label element itself.           |

## Returns

| Member           | Type            | Notes                                                              |
| ---------------- | --------------- | ------------------------------------------------------------------ |
| `getRootProps()` | `{ for?, id? }` | Spread on the `<label>`. React adapters: rename `for` → `htmlFor`. |

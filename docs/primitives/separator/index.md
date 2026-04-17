## About

A divider between sections. Stateless — the entire primitive is one prop getter that emits the right ARIA role and orientation. Use `decorative: true` (the default in most design systems' visual hierarchy is purely cosmetic) to keep screen readers from announcing a meaningless region boundary; otherwise the separator exposes `role="separator"` with `aria-orientation`.

A `data-orientation` attribute is always present so styling can hook into orientation without branching on `decorative`.

## Install

```bash
pnpm add dokuma
```

## Options

| Option        | Type                         | Notes                                                                |
| ------------- | ---------------------------- | -------------------------------------------------------------------- |
| `orientation` | `"horizontal" \| "vertical"` | Default `"horizontal"`. Sets `aria-orientation` when not decorative. |
| `decorative`  | `boolean`                    | Default `false`. Use `true` when the separator is purely visual.     |

## Returns

| Member           | Type                                            | Notes                                |
| ---------------- | ----------------------------------------------- | ------------------------------------ |
| `orientation`    | `"horizontal" \| "vertical"`                    | Echoes the resolved orientation.     |
| `decorative`     | `boolean`                                       | Echoes the resolved decorative flag. |
| `getRootProps()` | `{ role, aria-orientation?, data-orientation }` | Spread on the separator element.     |

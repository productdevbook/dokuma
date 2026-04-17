## About

Renders content that is invisible to sighted users but still read by assistive tech. Use for icon-only buttons, live-region announcements, or any text that exists for screen readers only. Stateless — pure prop getter that emits the standard `.sr-only` style block (absolute positioning, 1×1 px, `clip-path: inset(50%)`, `white-space: nowrap`).

The style is returned as a plain object on every call, so it can be spread into React's `style` prop, Vue's `:style` binding, or assigned directly with `Object.assign(el.style, ...)` from vanilla.

## Install

```bash
pnpm add dokuma
```

## Returns

| Member           | Type        | Notes                                           |
| ---------------- | ----------- | ----------------------------------------------- |
| `getRootProps()` | `{ style }` | Spread on the element you want hidden visually. |

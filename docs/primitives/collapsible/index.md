## About

A two-state expand/collapse region. Behavior, ARIA, and prop shape are identical to Disclosure — Collapsible is the same primitive surfaced under the vocabulary Radix and several design systems prefer when the trigger doesn't visually look like a button (e.g. a card header or a row affordance). Use whichever name fits your design tokens; the runtime cost is the same.

## Install

```bash
pnpm add dokuma
```

## Options & Returns

Identical to [Disclosure](#/disclosure). See `dokuma/disclosure` for the full options/returns reference.

```ts
import { createCollapsible } from "dokuma/collapsible"

const c = createCollapsible({ defaultOpen: false })
c.open.get() // false
c.toggle()
c.open.get() // true
```

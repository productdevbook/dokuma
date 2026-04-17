# dokuma

> Framework-agnostic, zero-dependency headless UI primitives. The weave (Turkish: _dokuma_) that ties your design system to any framework.

`radix-ui`, `@base-ui-components/react`, `@headlessui/react` — all React-only.
`dokuma` is the same idea, but the primitives are plain TypeScript functions and reactive stores, with framework integrations layered on top.

- **Agnostic.** Works in vanilla HTML via CDN, in React, Vue, Svelte, Solid, Angular, Preact, Qwik, Lit, web components, and inside native mobile shells (Capacitor, React Native WebView, Tauri).
- **Zero runtime dependencies.** Pure ESM. No CJS.
- **SSR-safe.** No top-level DOM access.
- **Accessibility-first.** WAI-ARIA, keyboard, focus management baked in.
- **Tree-shakeable.** Each primitive is a separate sub-path export.
- **Tiny.** Whole package under 75 KB raw, gzip ≈ 1/3 of that.

> **Status:** very early. APIs may change. Eleven primitives shipped: `Disclosure`, `Accordion`, `Tabs`, `Switch`, `Toggle`, `Toggle Group`, `Dialog`, `Tooltip`, `Popover`, `Avatar`, `Progress`.

## Install

```bash
pnpm add dokuma
```

Or use it directly from a CDN — no build step:

```html
<script type="module">
  import { mountDisclosure } from "https://esm.sh/dokuma/vanilla"

  mountDisclosure({
    trigger: "#my-button",
    panel: "#my-panel",
  })
</script>
```

## Quickstart

### Vanilla

```html
<button id="trigger">Toggle</button>
<div id="panel">Hello.</div>

<script type="module">
  import { mountDisclosure } from "dokuma/vanilla"

  mountDisclosure({
    trigger: "#trigger",
    panel: "#panel",
    defaultOpen: false,
    onOpenChange: (open) => console.log("open:", open),
  })
</script>
```

### React

```tsx
import * as React from "react"
import { createUseDisclosure } from "dokuma/react"

const useDisclosure = createUseDisclosure(React)

function Demo() {
  const d = useDisclosure({ defaultOpen: false })
  return (
    <>
      <button {...d.getTriggerProps()}>Toggle</button>
      <div {...d.getPanelProps()}>Hello from React.</div>
    </>
  )
}
```

### Vue

```vue
<script setup>
import * as Vue from "vue"
import { createUseDisclosure } from "dokuma/vue"

const useDisclosure = createUseDisclosure(Vue)
const d = useDisclosure({ defaultOpen: false })
</script>

<template>
  <button v-bind="d.triggerProps">Toggle</button>
  <div v-bind="d.panelProps">Hello from Vue.</div>
</template>
```

## Primitives

| Primitive    | Path                  | What it does                                                             |
| ------------ | --------------------- | ------------------------------------------------------------------------ |
| Disclosure   | `dokuma/disclosure`   | Show/hide a panel via a button. The foundation primitive.                |
| Accordion    | `dokuma/accordion`    | Stack of collapsible items. Single or multiple open. Arrow-key nav.      |
| Tabs         | `dokuma/tabs`         | Tablist with roving focus, automatic or manual activation.               |
| Switch       | `dokuma/switch`       | On/off control. `role="switch"`, optional hidden checkbox for forms.     |
| Toggle       | `dokuma/toggle`       | Single pressed-state button (`aria-pressed`).                            |
| Toggle Group | `dokuma/toggle-group` | Coordinated set of Toggles. Single (alignment) or multiple (formatting). |
| Dialog       | `dokuma/dialog`       | Modal/non-modal dialog. Focus trap, scroll lock, escape, click-outside.  |
| Tooltip      | `dokuma/tooltip`      | Hover/focus floating label. Viewport-aware positioning.                  |
| Popover      | `dokuma/popover`      | Click-triggered floating panel. Focus trap, escape, click-outside.       |
| Avatar       | `dokuma/avatar`       | Image with fallback. Status state machine, eager preload.                |
| Progress     | `dokuma/progress`     | ARIA progressbar with indeterminate, loading, complete states.           |

## Adapters

| Adapter | Path             | Use                                                     |
| ------- | ---------------- | ------------------------------------------------------- |
| Vanilla | `dokuma/vanilla` | `mount*` helpers for every primitive.                   |
| React   | `dokuma/react`   | `createUse*(React)` factories per primitive.            |
| Vue     | `dokuma/vue`     | `createUse*(Vue)` composables, mirror of the React API. |

Svelte, Solid, Angular, Lit adapters: planned.

## Why "dokuma"?

In Turkish, _dokuma_ means **the weave** — the cloth where independent threads are bound into a single fabric. That is what these primitives are: the weave that binds your design system to whatever framework happens to be on the other side.

## License

MIT — © productdevbook

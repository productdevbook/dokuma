# dokuma

> Framework-agnostic, zero-dependency headless UI primitives. The weave (Turkish: _dokuma_) that ties your design system to any framework.

`radix-ui`, `@base-ui-components/react`, `@headlessui/react` — all React-only.
`dokuma` is the same idea, but the primitives are plain TypeScript functions and reactive stores, with framework integrations layered on top.

- **Agnostic.** Works in vanilla HTML via CDN, in React, Vue, Svelte, Solid, Angular, Preact, Qwik, Lit, web components, and inside native mobile shells (Capacitor, React Native WebView, Tauri).
- **Zero runtime dependencies.** Pure ESM. No CJS.
- **SSR-safe.** No top-level DOM access.
- **Accessibility-first.** WAI-ARIA, keyboard, focus management baked in.
- **Tree-shakeable.** Each primitive is a separate sub-path export.
- **Tiny.** Whole package under 100 KB raw, gzip ≈ 1/3 of that.

> **Status:** v0.2 — 29 primitives shipped. APIs are settling but may still change before 1.0.

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
import { useDisclosure } from "dokuma/react-hooks"

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

For Preact compat or an isolated React copy, use the factory entry instead:

```tsx
import * as React from "react"
import { createUseDisclosure } from "dokuma/react"
const useDisclosure = createUseDisclosure(React)
```

### Vue

```vue
<script setup>
import { useDisclosure } from "dokuma/vue-composables"
const d = useDisclosure({ defaultOpen: false })
</script>

<template>
  <button v-bind="d.triggerProps">Toggle</button>
  <div v-bind="d.panelProps">Hello from Vue.</div>
</template>
```

## Primitives

| Primitive       | Path                     | What it does                                                             |
| --------------- | ------------------------ | ------------------------------------------------------------------------ |
| Disclosure      | `dokuma/disclosure`      | Show/hide a panel via a button. The foundation primitive.                |
| Accordion       | `dokuma/accordion`       | Stack of collapsible items. Single or multiple open. Arrow-key nav.      |
| Tabs            | `dokuma/tabs`            | Tablist with roving focus, automatic or manual activation.               |
| Switch          | `dokuma/switch`          | On/off control. `role="switch"`, optional hidden checkbox for forms.     |
| Toggle          | `dokuma/toggle`          | Single pressed-state button (`aria-pressed`).                            |
| Toggle Group    | `dokuma/toggle-group`    | Coordinated set of Toggles. Single (alignment) or multiple (formatting). |
| Dialog          | `dokuma/dialog`          | Modal/non-modal dialog. Focus trap, scroll lock, escape, click-outside.  |
| Tooltip         | `dokuma/tooltip`         | Hover/focus floating label. Viewport-aware positioning.                  |
| Popover         | `dokuma/popover`         | Click-triggered floating panel. Focus trap, escape, click-outside.       |
| Avatar          | `dokuma/avatar`          | Image with fallback. Status state machine, eager preload.                |
| Progress        | `dokuma/progress`        | ARIA progressbar with indeterminate, loading, complete states.           |
| Menu            | `dokuma/menu`            | Click-triggered actions menu. Typeahead, focus-based navigation.         |
| Context Menu    | `dokuma/context-menu`    | Right-click + long-press menu anchored to cursor. Composes Menu.         |
| Slider          | `dokuma/slider`          | Range input. Single value or two-thumb range. Pointer + full keyboard.   |
| Radio Group     | `dokuma/radio-group`     | Single-selection radio group. Roving tabindex, arrows navigate + select. |
| Checkbox        | `dokuma/checkbox`        | Three-state: true / false / indeterminate. ARIA mixed.                   |
| Combobox        | `dokuma/combobox`        | Searchable single-select. WAI-ARIA 1.2 with `aria-activedescendant`.     |
| Toaster         | `dokuma/toaster`         | Notification queue, auto-dismiss, hover/focus pause, ARIA live region.   |
| Separator       | `dokuma/separator`       | Section divider. `role="separator"` or `role="none"` when decorative.    |
| Visually Hidden | `dokuma/visually-hidden` | Screen-reader-only content via the standard `.sr-only` style block.      |
| Collapsible     | `dokuma/collapsible`     | Disclosure under a different name, for design systems that prefer it.    |
| Alert Dialog    | `dokuma/alert-dialog`    | Dialog with `role="alertdialog"` and outside-click closing forced off.   |
| Hover Card      | `dokuma/hover-card`      | Tooltip with longer delays + `role="dialog"` for interactive content.    |
| Label           | `dokuma/label`           | `<label>` association helper. Emits `for` + optional `id`.               |
| Aspect Ratio    | `dokuma/aspect-ratio`    | Modern `aspect-ratio` CSS wrapper for media slots.                       |
| Breadcrumb      | `dokuma/breadcrumb`      | Pure ARIA wrapper for a breadcrumb trail. Marks separators decorative.   |
| Pagination      | `dokuma/pagination`      | Page list with ellipsis algorithm. `aria-current` on the active page.    |
| Number Input    | `dokuma/number-input`    | Stepper with min/max/step, hold-to-repeat, hidden form input.            |
| OTP Input       | `dokuma/otp-input`       | N-cell pin input with auto-advance, paste distribution, isComplete.      |

Cross-cutting helpers exported from the package root: `createPresence` (animate-out), `getDefaultPortalTarget` / `resolvePortalTarget` (portal helpers), `DokumaError`, `createSignal`. Internal layer stacks (`FocusScope`, `DismissibleLayer`) are handled automatically by every dismissible primitive — no setup needed for nested modals.

## Adapters

| Adapter           | Path                     | Use                                                            |
| ----------------- | ------------------------ | -------------------------------------------------------------- |
| Vanilla           | `dokuma/vanilla`         | `mount*` helpers for every primitive.                          |
| React (factory)   | `dokuma/react`           | `createUse*(React)` factories — pass your own React instance.  |
| React (pre-bound) | `dokuma/react-hooks`     | Pre-bound `useDisclosure`, `useDialog`, etc. Skip the factory. |
| Vue (factory)     | `dokuma/vue`             | `createUse*(Vue)` composables, mirror of the React API.        |
| Vue (pre-bound)   | `dokuma/vue-composables` | Pre-bound composables. Skip the factory.                       |

Svelte / Solid / Angular / Lit adapters are out of scope for this maintainer — the framework-agnostic `create*` functions in `dokuma` (root entry) make a thin wrapper for any reactive runtime a small project. Community contributions welcome.

## Why "dokuma"?

In Turkish, _dokuma_ means **the weave** — the cloth where independent threads are bound into a single fabric. That is what these primitives are: the weave that binds your design system to whatever framework happens to be on the other side.

## License

MIT — © productdevbook

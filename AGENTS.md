# dokuma

Framework-agnostic, zero-dependency headless UI primitives. The weave (Turkish: _dokuma_) that ties your design system to any framework. Pure TypeScript, tree-shakeable, SSR-safe, accessibility-first. Works in vanilla HTML via CDN, in any framework (React, Vue, Svelte, Solid, Angular, Preact, Qwik, Lit, web components), and inside native mobile shells.

> [!IMPORTANT]
> Keep `AGENTS.md` updated with project status.

## Project Structure

```
src/
  index.ts                 # Main entry — re-exports public API
  env.d.ts                 # Runtime DOM type declarations
  errors.ts                # DokumaError, primitive-specific errors
  _types.ts                # Shared types (Orientation, Direction, Disabled, Id, …)
  _id.ts                   # createId — SSR-safe, collision-free id generator
  _signal.ts               # createSignal / createComputed — tiny reactive core
  _store.ts                # createStore — scoped state container
  _focus.ts                # focus-trap, roving-tabindex, restoreFocus
  _keyboard.ts             # keymap helpers (Arrow*, Home/End, type-ahead)
  _dom.ts                  # tiny DOM helpers (isBrowser, on, off, raf, contains)
  _aria.ts                 # ARIA attribute builders
  _collection.ts           # Sorted collection of registered items (DOM order)
  primitives/              # Headless behaviors (one file per primitive)
test/
  *.test.ts                # vitest suites
scripts/
  bundle-budget.mjs        # Per-file size budget enforcer
```

## Design Principles

- **Agnostic by construction** — no React, no Vue, no framework runtime in `src/`. Behaviors are plain functions and stores. Framework adapters (when added) live under `adapters/` and only translate signals to that framework's reactivity.
- **CDN-first** — every primitive must be usable from a single `<script type="module">` tag with no build step.
- **Zero runtime dependencies.** Polyfills are out of scope; ship modern ESM.
- **Pure ESM.** No CJS.
- **SSR-safe.** No top-level DOM access; every browser-touching call is gated by `isBrowser()`.
- **Accessibility-first.** Keyboard, ARIA, focus management baked in. WAI-ARIA Authoring Practices is the spec.
- **Tree-shakeable.** No barrel side effects. Each primitive is a separate sub-path export.
- **Strict TypeScript.** tsgo for typecheck, `verbatimModuleSyntax`, `isolatedModules`.
- **Internal files prefixed with `_`** (`_types.ts`, `_signal.ts`, …); they are not part of the public API.
- **Named exports only.** No default exports.

## Build & Scripts

```bash
pnpm build          # obuild (rolldown) → dist/
pnpm dev            # vitest watch
pnpm lint           # oxlint + oxfmt --check
pnpm lint:fix       # oxlint --fix + oxfmt
pnpm fmt            # oxfmt
pnpm test           # pnpm lint && pnpm typecheck && vitest run
pnpm typecheck      # tsgo --noEmit
pnpm bundle-budget  # check raw byte size budgets
pnpm attw           # Are-The-Types-Wrong CLI
pnpm release        # pnpm test && build && bundle-budget && bumpp --commit --tag --push --all
```

## Code Conventions

- **Formatter:** oxfmt (double quotes, no semicolons)
- **Linter:** oxlint (unicorn, typescript, oxc plugins)
- **Tests:** vitest in `test/`, flat naming, jsdom via `// @vitest-environment jsdom`
- **Exports:** explicit in `src/index.ts`, no barrel re-exports
- **Commits:** semantic lowercase (`feat:`, `fix:`, `chore:`, `docs:`)

## Status

- ✅ 29 primitives shipped: Disclosure, Accordion, Tabs, Switch, Toggle, ToggleGroup, Dialog, Tooltip, Popover, Avatar, Progress, Menu, Slider, RadioGroup, Checkbox, Toaster, Combobox, ContextMenu, Separator, VisuallyHidden, Collapsible, AlertDialog, HoverCard, Label, AspectRatio, Breadcrumb, Pagination, NumberInput, OtpInput.
- ✅ Architectural primitives: Presence (animate-out), Portal helper, FocusScope (nested-modal stack), DismissibleLayer stack.
- ✅ 3 adapters: vanilla, react, vue. Pre-bound entries: `dokuma/react-hooks`, `dokuma/vue-composables`.
- ✅ Published to npm as `dokuma`.
- ℹ️ Svelte / Solid / Angular / Lit adapters: out of scope for this maintainer — community contributions welcome via thin `createUse*(framework)` wrappers around the framework-agnostic `create*` functions.

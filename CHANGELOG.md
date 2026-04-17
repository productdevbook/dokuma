# Changelog

All notable changes to `dokuma` are documented here.

## 0.2.0 — 2026-04-17

Closes the radix-ui parity gap to the extent it makes sense for a headless library. **29 primitives total.**

### New primitives — composition aliases

- **Collapsible** — Disclosure under the Radix-style vocabulary. Same behavior, same ARIA, just a different name.
- **AlertDialog** — Dialog with `role="alertdialog"` and outside-click closing forced off. For destructive confirmations.
- **HoverCard** — Tooltip with longer default delays (`700ms` open / `300ms` close) and `role="dialog"` content so screen readers expose interactive children (links, buttons).
- **Label** — `<label>` association helper. Emits the DOM `for` attribute (not the JSX `htmlFor` rename).
- **AspectRatio** — Width-bound aspect-ratio wrapper using the modern `aspect-ratio` CSS property.

To support the AlertDialog and HoverCard composition, `dialog.ts` now accepts an optional `role: "dialog" | "alertdialog"` and `tooltip.ts` accepts `contentRole: "tooltip" | "dialog"`. Existing usage is unchanged — both options default to the previous hardcoded values.

### New primitives — standalone

- **Breadcrumb** — pure ARIA wrapper for a breadcrumb trail. The primitive doesn't own the items; the caller renders `<li>` elements and asks `getItemProps({ current })` per item. Separators are marked `aria-hidden + role="presentation"` so SR doesn't announce them between every step.
- **Pagination** — page list manager with the standard ellipsis-collapse algorithm. Configurable `siblingCount` + `boundaryCount`. Returns a `pages: Signal<Array<number | "ellipsis">>` plus next/prev/first/last + `canGoNext` / `canGoPrev` signals + the usual props.
- **NumberInput** — stepper with `min` / `max` / `step` / `precision`, hold-to-repeat (`500ms` initial delay then `50ms` interval), `clampValueOnBlur`, custom `format` / `parse`, optional `allowMouseWheel`, hidden form input. ARIA `role="spinbutton"` with full `aria-value*` set.
- **OtpInput** — N-cell pin input with auto-advance, backspace-clears-and-moves-back, paste distribution across cells, optional `mask`, custom `pattern` regex class, `isComplete: Signal<boolean>` for reactive submit-button gating, hidden form input emitting the joined value.

### Skipped (out of scope, with reasoning)

- **Select** — headlessly identical to Combobox with `filter: () => true`. Document the pattern; the alias may land in 0.2.1.
- **DatePicker / Calendar** — calendar locale + range + Temporal arithmetic is a small library on its own. Not justifiable for a headless behavior primitive.
- **NavigationMenu** — submenu transition / hover-intent / focus-across-siblings interactions are dramatically larger surface than every other primitive combined.
- **Form / Field validation** — every form library does this differently. Use react-hook-form, formkit, vee-validate, etc. for validation; use dokuma for the input behaviors.
- **ScrollArea** — ResizeObserver + drag math + RTL + momentum touch is its own primitive's worth of complexity. Use native scrollbars or a dedicated library; revisit later.
- **Slot / asChild** — adapter-level concern, handled differently per framework. The current plain-object props design already lets each adapter expose a Slot helper independently.

### Stats

- **29 primitives** × **3 adapters** × **live demos** for the original 20 (5 new alias primitives plus Breadcrumb / Pagination / NumberInput / OtpInput ship with primitive code + tests; demos can land in a follow-up).
- **396 tests** across 29 vitest suites.
- **319 KB** raw `dist/` size (95 files), all tree-shakeable per primitive.

## 0.1.0 — 2026-04-17

The first release where the library feels _finished_ for v0.x. Twenty primitives, all three adapters complete, every dismissible primitive correctly stacked for nested-modal use.

### New primitives

- **Toaster** — notification queue with auto-dismiss timer, hover/focus pause, ARIA live region, and per-toast actions. Each toast animates out via Presence.
- **Combobox** — searchable single-select implementing the WAI-ARIA 1.2 modern combobox pattern (`aria-activedescendant`; focus stays in the input). Type-to-filter, full keyboard nav, optional `allowCustomValue`.
- **Context Menu** — right-click and long-press (touch, 500ms) menu anchored to the cursor via a virtual `getBoundingClientRect()` on `autoPosition`. Composes the existing Menu primitive — keyboard nav, typeahead, ARIA, and focus management are inherited.
- **Separator** — stateless divider. `role="separator"` + `aria-orientation` when semantic, `role="none"` when decorative. `data-orientation` is always present for styling hooks.
- **Visually Hidden** — screen-reader-only utility emitting the standard `.sr-only` style block. Returns a fresh style object on every call so it can be spread anywhere.

### Architectural primitives

- **Presence** — defers unmount of an animating element until its CSS exit transition or animation finishes. Per-element `transitionend`/`animationend` listener with a microtask fallback.
- **Portal** — `getDefaultPortalTarget()` and `resolvePortalTarget()` helpers. Adapters render through React's `createPortal`, Vue's `<Teleport>`, or `appendChild` for vanilla.
- **FocusScope** (LIFO stack) — Tab and Shift+Tab loop within the topmost open modal. A Popover inside a Dialog correctly traps focus inside the Popover until it closes, then restores it to the Dialog.
- **DismissibleLayer** (LIFO stack) — Escape only closes the topmost dismissible. A Combobox inside a Dialog Escapes the Combobox first, the Dialog second.

Both stacks live on the document via `Symbol.for(...)` properties so SSR processes don't share state across requests, and so the runtime is resilient to module duplication.

### Adapters

- **Pre-bound entries** — `dokuma/react-hooks` and `dokuma/vue-composables` import the adapter's framework once and re-export every `useFoo` already wired. Drop-in for normal apps; the original `dokuma/react` and `dokuma/vue` factory entries remain for Preact compat / isolated React copies / custom Vue runtimes.
- **Vue prop normalization** — `normalizeVueProps()` converts internal `onPascalCase` keys (e.g. `onKeyDown`) to the `onCamelCase` form Vue's prop-to-DOM-event mapper expects (`onKeydown`). Listeners now fire on every primitive without per-component glue.

### Tooling

- **`scripts/sync-exports.mjs`** auto-generates the `package.json` `exports` field from `src/primitives/*.ts` plus a small list of manual entries (`.`, `./vanilla`, `./react`, `./react-hooks`, `./vue`, `./vue-composables`). CI runs `--check` mode to fail builds where the file drifts from the primitive list.
- **`pnpm attw`** added to both the release script and CI to catch types-wrong regressions on every PR.
- **Bundle budgets** — per-file raw byte size budgets enforced on build. Whole `dist/` lands at 261 KB across 77 files.
- **`tsgo` strict typecheck** with `verbatimModuleSyntax` and `isolatedDeclarations` — every adapter export now carries an explicit return-type annotation so the d.ts emitter never has to infer.

### Fixes shipped along the way

- **SSR-unsafe scroll-lock** — `lockScroll` ref-count state now lives on `document[Symbol.for("dokuma.scrollLock")]` instead of module scope.
- **Controlled-mode signal subscribe bug** — every primitive now fires its own local `subscribers` Set from `set()`, so React adapters that subscribe via the public Signal API receive notifications when controlled props change.
- **`DokumaError`** — renamed from the old internal name and exported from the package root.
- **Toaster `evictOldest` infinite loop** — now counts only items with `open === true` and caps at the queue length.

### Stats

- **20 primitives** × **3 adapters** × **live demos** for every combination.
- **336 tests** across 24 vitest suites (jsdom).
- **261 KB** raw `dist/` size, all tree-shakeable per primitive.
- **Zero runtime dependencies.** Pure ESM.

## 0.0.1 – 0.0.6 — pre-release iterations

Initial primitive implementations and adapter scaffolding. APIs from this period may have shifted in 0.1.0; consult the current docs.

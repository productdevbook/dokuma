import { mountAccordion } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div id="acc-root" class="acc">
      <div data-dokuma-accordion-item="a" class="acc-item">
        <button data-dokuma-accordion-trigger class="acc-trigger">What is dokuma?</button>
        <div data-dokuma-accordion-panel class="acc-panel">
          A framework-agnostic, zero-dependency headless UI primitives library. Same primitive,
          every framework. Even raw HTML.
        </div>
      </div>
      <div data-dokuma-accordion-item="b" class="acc-item">
        <button data-dokuma-accordion-trigger class="acc-trigger">Why headless?</button>
        <div data-dokuma-accordion-panel class="acc-panel">
          Headless ships behavior, ARIA wiring, and keyboard handling. You ship the look.
          That separation is what makes the primitive portable across frameworks and design systems.
        </div>
      </div>
      <div data-dokuma-accordion-item="c" class="acc-item">
        <button data-dokuma-accordion-trigger class="acc-trigger">How is single mode different from multiple?</button>
        <div data-dokuma-accordion-panel class="acc-panel">
          Single mode keeps at most one panel open. Multiple lets you open as many as you want.
          Try the toggle below.
        </div>
      </div>
    </div>
  `

  const { accordion, destroy } = mountAccordion({
    root: "#acc-root",
    parent: root,
    type: "single",
    defaultValue: "a",
    onValueChange: (v) => ctx.onState(`open: ${v || "—"}`),
  })

  ctx.onState(`open: ${accordion.values.get()[0] ?? "—"}`)

  return destroy
}

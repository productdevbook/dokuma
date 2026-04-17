import { mountCollapsible } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <button id="c-trigger" class="demo-trigger">Show details</button>
    <div id="c-panel" class="demo-panel">
      <strong>Collapsible content.</strong>
      <p style="margin: 8px 0 0; color: var(--muted)">
        Same behavior as Disclosure — exposed under a different name when your
        design system already calls this pattern "Collapsible".
      </p>
    </div>
  `
  const { collapsible, destroy } = mountCollapsible({
    trigger: "#c-trigger",
    panel: "#c-panel",
    root,
  })
  ctx.onState(collapsible.open.get() ? "open" : "closed")
  const unsub = collapsible.open.subscribe((v) => ctx.onState(v ? "open" : "closed"))
  return () => {
    unsub()
    destroy()
  }
}

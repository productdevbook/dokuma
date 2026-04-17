import { mountDisclosure } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <button id="d-trigger" class="demo-trigger">Toggle panel</button>
    <div id="d-panel" class="demo-panel">
      <strong>Hello from the panel.</strong>
      <p style="margin: 8px 0 0; color: var(--muted)">
        This panel is shown/hidden by toggling the <code>hidden</code> attribute.
        The button reflects state via <code>aria-expanded</code>.
      </p>
    </div>
  `

  const { disclosure, destroy } = mountDisclosure({
    trigger: "#d-trigger",
    panel: "#d-panel",
    root,
  })

  ctx.onState(disclosure.open.get() ? "open" : "closed")
  const unsub = disclosure.open.subscribe((v) => ctx.onState(v ? "open" : "closed"))

  return () => {
    unsub()
    destroy()
  }
}

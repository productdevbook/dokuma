import { mountToggleGroup } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div id="tg-root" class="toggle-group" aria-label="Text alignment">
      <button data-dokuma-toggle-group-item="left" class="toggle">Left</button>
      <button data-dokuma-toggle-group-item="center" class="toggle">Center</button>
      <button data-dokuma-toggle-group-item="right" class="toggle">Right</button>
    </div>
  `
  const { toggleGroup, destroy } = mountToggleGroup({
    root: "#tg-root",
    parent: root,
    type: "single",
    defaultValue: "left",
    "aria-label": "Text alignment",
    onValueChange: (v) => ctx.onState(`pressed: ${v || "—"}`),
  })
  ctx.onState(`pressed: ${toggleGroup.values.get()[0] ?? "—"}`)
  return destroy
}

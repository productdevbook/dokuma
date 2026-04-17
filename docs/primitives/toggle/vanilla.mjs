import { mountToggle } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `<button id="t-1" class="toggle">Bold</button>`
  const { toggle: tg, destroy } = mountToggle({
    root: "#t-1",
    parent: root,
    onPressedChange: (v) => ctx.onState(v ? "on" : "off"),
  })
  ctx.onState(tg.pressed.get() ? "on" : "off")
  return destroy
}

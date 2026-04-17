import { mountTooltip } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="display:flex; gap:24px; align-items:center; padding: 40px 0; justify-content:center;">
      <button id="tt-trigger" class="demo-trigger" type="button">Hover or focus me</button>
      <div id="tt-content" class="tooltip" role="tooltip" hidden></div>
    </div>
  `
  const content = root.querySelector("#tt-content")
  content.textContent = "Save your changes"
  // remove inline hidden so data-state controls it
  content.removeAttribute("hidden")
  content.style.visibility = "hidden"

  const { tooltip, destroy } = mountTooltip({
    trigger: "#tt-trigger",
    content: "#tt-content",
    parent: root,
    delayShow: 200,
    onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
  })

  // bind visibility to data-state via subscription
  const sync = (open) => {
    content.style.visibility = open ? "visible" : "hidden"
  }
  sync(tooltip.open.get())
  const unsub = tooltip.open.subscribe(sync)

  ctx.onState(tooltip.open.get() ? "open" : "closed")
  return () => {
    unsub()
    destroy()
  }
}

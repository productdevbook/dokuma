import { mountHoverCard } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="display:flex; gap:24px; align-items:center; padding: 40px 0; justify-content:center;">
      <a id="hc-trigger" class="demo-trigger" href="#" style="text-decoration:underline;">@ada</a>
      <div id="hc-content" class="popover-content" style="visibility:hidden; min-width:240px; padding:12px;">
        <strong>Ada Lovelace</strong>
        <p style="margin: 6px 0 8px; color: var(--muted);">
          First programmer. Wrote the algorithm Babbage's Analytical Engine never ran.
        </p>
        <a href="#" style="text-decoration:underline;">Visit profile</a>
      </div>
    </div>
  `
  const content = root.querySelector("#hc-content")
  const { hoverCard, destroy } = mountHoverCard({
    trigger: "#hc-trigger",
    content: "#hc-content",
    parent: root,
    delayShow: 300,
    onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
  })
  const sync = (open) => {
    content.style.visibility = open ? "visible" : "hidden"
  }
  sync(hoverCard.open.get())
  const unsub = hoverCard.open.subscribe(sync)
  ctx.onState(hoverCard.open.get() ? "open" : "closed")
  return () => {
    unsub()
    destroy()
  }
}

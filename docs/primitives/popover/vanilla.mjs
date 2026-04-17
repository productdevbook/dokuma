import { mountPopover } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="padding: 40px 0; display:flex; justify-content:center;">
      <button id="pop-trigger" class="demo-trigger" type="button">Open popover</button>
    </div>
    <div id="pop-content" class="popover">
      <h3 class="popover-title">Account</h3>
      <p class="popover-desc">Manage your account settings here. Press Escape or click outside to dismiss.</p>
      <div class="popover-actions">
        <button id="pop-cancel" class="dialog-button">Cancel</button>
        <button class="dialog-button dialog-primary">Save</button>
      </div>
    </div>
  `
  const content = root.querySelector("#pop-content")
  content.style.visibility = "hidden"

  const { popover, destroy } = mountPopover({
    trigger: "#pop-trigger",
    content: "#pop-content",
    parent: root,
    side: "bottom",
    align: "center",
    sideOffset: 12,
    onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
  })

  const sync = (open) => {
    content.style.visibility = open ? "visible" : "hidden"
  }
  sync(popover.open.get())
  const unsub = popover.open.subscribe(sync)

  root.querySelector("#pop-cancel").addEventListener("click", () => popover.hide())

  ctx.onState(popover.open.get() ? "open" : "closed")
  return () => {
    unsub()
    destroy()
  }
}

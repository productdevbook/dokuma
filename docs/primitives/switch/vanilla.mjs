import { mountSwitch } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="switch-row">
      <label for="sw-1" class="switch-label">Notifications</label>
      <button id="sw-1" class="switch">
        <span class="switch-thumb" data-thumb></span>
      </button>
    </div>
  `

  const { switch: sw, destroy } = mountSwitch({
    root: "#sw-1",
    parent: root,
    onCheckedChange: (v) => ctx.onState(v ? "on" : "off"),
  })

  // wire the thumb data-state too
  const thumb = root.querySelector("[data-thumb]")
  const syncThumb = (v) => {
    thumb.setAttribute("data-state", v ? "checked" : "unchecked")
  }
  syncThumb(sw.checked.get())
  const unsubThumb = sw.checked.subscribe(syncThumb)

  ctx.onState(sw.checked.get() ? "on" : "off")

  return () => {
    unsubThumb()
    destroy()
  }
}

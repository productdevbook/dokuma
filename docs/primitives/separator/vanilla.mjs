import { mountSeparator } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px; padding:24px 0;">
      <div>Above</div>
      <div id="sep-h" style="height: 1px; background: var(--border, #999);"></div>
      <div>Between</div>
      <div style="display:flex; align-items:center; gap:12px;">
        <span>Left</span>
        <div id="sep-v" style="width: 1px; height: 24px; background: var(--border, #999);"></div>
        <span>Right</span>
      </div>
    </div>
  `

  const h = mountSeparator({ root: "#sep-h", parent: root, orientation: "horizontal" })
  const v = mountSeparator({ root: "#sep-v", parent: root, orientation: "vertical" })
  ctx.onState("two separators mounted")
  return () => {
    h.destroy()
    v.destroy()
  }
}

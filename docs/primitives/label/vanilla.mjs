import { mountLabel } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px; padding:24px 0;">
      <label id="lbl" class="demo-label">Email</label>
      <input id="email" type="email" placeholder="ada@example.com" class="combo-input" style="max-width:280px;" />
    </div>
  `
  const { destroy } = mountLabel({
    root: "#lbl",
    parent: root,
    htmlFor: "email",
  })
  ctx.onState("for=email")
  return destroy
}

import { mountAvatar } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="avatar-row">
      <div class="avatar">
        <img id="av-img" alt="" />
        <span id="av-fb" class="avatar-fb">AL</span>
      </div>
      <div>
        <div style="font-weight:600;">Ada Lovelace</div>
        <div style="color:var(--muted); font-size:13px;" id="av-state">Status: …</div>
      </div>
    </div>
  `
  const stateEl = root.querySelector("#av-state")
  const { avatar, destroy } = mountAvatar({
    src: "https://github.com/productdevbook.png?size=64",
    image: "#av-img",
    fallback: "#av-fb",
    parent: root,
    onStatusChange: (s) => {
      stateEl.textContent = `Status: ${s}`
      ctx.onState(s)
    },
  })
  ctx.onState(avatar.status.get())
  stateEl.textContent = `Status: ${avatar.status.get()}`
  return destroy
}

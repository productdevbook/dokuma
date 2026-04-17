import { mountAvatar } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="avatar-row">
      <div class="avatar">
        <img id="av-img" alt="" />
        <span id="av-fb" class="avatar-fb">MK</span>
      </div>
      <div>
        <div style="font-weight:600;">Mehmet Kahya</div>
        <div style="color:var(--muted); font-size:13px;" id="av-state">…</div>
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
      stateEl.textContent = s
      ctx.onState(s)
    },
  })
  ctx.onState(avatar.status.get())
  stateEl.textContent = avatar.status.get()
  return destroy
}

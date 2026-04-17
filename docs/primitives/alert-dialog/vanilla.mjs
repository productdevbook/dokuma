import { mountAlertDialog } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <button id="ad-trigger" class="demo-trigger">Delete account…</button>
    <div id="ad-overlay" class="dialog-overlay"></div>
    <div id="ad-content" class="dialog-content">
      <h2 class="dialog-title">Delete account?</h2>
      <p class="dialog-desc">
        This action is irreversible. Outside-clicks won't dismiss this dialog —
        you have to use one of the buttons.
      </p>
      <div class="dialog-actions">
        <button id="ad-cancel" class="dialog-button">Cancel</button>
        <button id="ad-confirm" class="dialog-button dialog-primary">Delete</button>
      </div>
    </div>
  `
  const { alertDialog, destroy } = mountAlertDialog({
    trigger: "#ad-trigger",
    content: "#ad-content",
    overlay: "#ad-overlay",
    parent: root,
    onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
  })
  root.querySelector("#ad-cancel").addEventListener("click", () => alertDialog.hide())
  root.querySelector("#ad-confirm").addEventListener("click", () => {
    ctx.onState("confirmed")
    alertDialog.hide()
  })
  ctx.onState("closed")
  return destroy
}

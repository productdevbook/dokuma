import { mountDialog } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <button id="d-trigger" class="demo-trigger">Open dialog</button>
    <div id="d-overlay" class="dialog-overlay" hidden></div>
    <div id="d-content" class="dialog-content" hidden>
      <h2 class="dialog-title">Confirm</h2>
      <p class="dialog-desc">Press Escape, click outside, or use the close button to dismiss.</p>
      <div class="dialog-actions">
        <button id="d-cancel" class="dialog-button">Cancel</button>
        <button class="dialog-button dialog-primary">Confirm</button>
      </div>
    </div>
  `

  // Hide the content+overlay initially via the data-state CSS rule.
  const content = root.querySelector("#d-content")
  const overlay = root.querySelector("#d-overlay")
  // remove HTML-level hidden so data-state controls it instead
  content.removeAttribute("hidden")
  overlay.removeAttribute("hidden")

  const { dialog, destroy } = mountDialog({
    trigger: "#d-trigger",
    content: "#d-content",
    overlay: "#d-overlay",
    parent: root,
    onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
  })

  const cancel = root.querySelector("#d-cancel")
  cancel.addEventListener("click", () => dialog.hide())

  ctx.onState(dialog.open.get() ? "open" : "closed")
  return destroy
}

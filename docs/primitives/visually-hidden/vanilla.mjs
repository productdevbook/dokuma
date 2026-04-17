import { mountVisuallyHidden } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="padding: 24px 0; display:flex; flex-direction:column; gap: 16px;">
      <button type="button" class="demo-trigger" style="display:inline-flex; align-items:center; gap:6px; width:fit-content;">
        <span aria-hidden="true">×</span>
        <span id="vh-label">Close dialog</span>
      </button>
      <p style="opacity: 0.7;">The "Close dialog" label is hidden visually but still read by screen readers.</p>
    </div>
  `
  const { destroy } = mountVisuallyHidden({ root: "#vh-label", parent: root })
  ctx.onState("hidden")
  return destroy
}

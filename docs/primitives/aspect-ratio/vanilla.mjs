import { mountAspectRatio } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="max-width:480px; padding:24px 0;">
      <div id="ar-box" style="background: linear-gradient(135deg, #4f46e5, #06b6d4); border-radius: 12px;"></div>
    </div>
  `
  const { destroy } = mountAspectRatio({ root: "#ar-box", parent: root, ratio: 16 / 9 })
  ctx.onState("ratio: 16/9")
  return destroy
}

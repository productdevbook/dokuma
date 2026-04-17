import { mountOtpInput } from "/dist/adapters/vanilla.mjs"

const LENGTH = 6

export function mount(root, ctx) {
  const cells = Array.from(
    { length: LENGTH },
    (_, i) => `
    <input id="otp-${i}" class="combo-input" style="width:36px; text-align:center; padding:6px 0;" />
  `,
  ).join("")
  root.innerHTML = `
    <div style="padding: 24px 0;">
      <div style="display:flex; gap:6px; align-items:center;">${cells}</div>
    </div>
  `
  const cellEls = Array.from({ length: LENGTH }, (_, i) => `#otp-${i}`)
  const { otpInput, destroy } = mountOtpInput({
    cells: cellEls,
    parent: root,
    onValueChange: (v) => ctx.onState(v ? `value: ${v}` : "empty"),
    onComplete: (v) => ctx.onState(`complete: ${v}`),
  })
  ctx.onState(otpInput.value.get() ? `value: ${otpInput.value.get()}` : "empty")
  return destroy
}

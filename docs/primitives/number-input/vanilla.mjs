import { mountNumberInput } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="padding:24px 0; max-width:240px;">
      <div role="group" style="display:flex; align-items:stretch; gap:0;">
        <button id="ni-dec" type="button" style="padding:6px 12px; border-radius:6px 0 0 6px;">−</button>
        <input id="ni-input" type="text" class="combo-input" style="flex:1; border-radius:0; text-align:center;" />
        <button id="ni-inc" type="button" style="padding:6px 12px; border-radius:0 6px 6px 0;">+</button>
      </div>
    </div>
  `
  const { numberInput, destroy } = mountNumberInput({
    input: "#ni-input",
    increment: "#ni-inc",
    decrement: "#ni-dec",
    parent: root,
    defaultValue: 1,
    min: 0,
    max: 99,
    step: 1,
    onValueChange: (v) => ctx.onState(`value: ${v ?? "—"}`),
  })
  ctx.onState(`value: ${numberInput.value.get() ?? "—"}`)
  return destroy
}

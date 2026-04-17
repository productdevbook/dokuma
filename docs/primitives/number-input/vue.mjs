import * as Vue from "vue"
import { createUseNumberInput } from "/dist/adapters/vue.mjs"

const useNumberInput = createUseNumberInput(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const ni = useNumberInput({
        defaultValue: 1,
        min: 0,
        max: 99,
        step: 1,
        onValueChange: (v) => ctx.onState(`value: ${v ?? "—"}`),
      })
      ctx.onState(`value: ${ni.valueRef.value ?? "—"}`)
      return {
        rootProps: ni.rootProps,
        inputProps: ni.inputProps,
        incProps: ni.incrementProps,
        decProps: ni.decrementProps,
      }
    },
    template: `
      <div style="padding:24px 0; max-width:240px;">
        <div v-bind="rootProps" style="display:flex; align-items:stretch; gap:0;">
          <button v-bind="decProps" style="padding:6px 12px; border-radius:6px 0 0 6px;">−</button>
          <input v-bind="inputProps" class="combo-input" style="flex:1; border-radius:0; text-align:center;" />
          <button v-bind="incProps" style="padding:6px 12px; border-radius:0 6px 6px 0;">+</button>
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

import * as Vue from "vue"
import { createUseOtpInput } from "/dist/adapters/vue.mjs"

const useOtpInput = createUseOtpInput(Vue)

const LENGTH = 6

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const otp = useOtpInput({
        length: LENGTH,
        onValueChange: (v) => ctx.onState(v ? `value: ${v}` : "empty"),
        onComplete: (v) => ctx.onState(`complete: ${v}`),
      })
      ctx.onState(otp.valueRef.value ? `value: ${otp.valueRef.value}` : "empty")
      return {
        indices: Array.from({ length: LENGTH }, (_, i) => i),
        cellProps: (i) => otp.cellProps(i),
      }
    },
    template: `
      <div style="padding: 24px 0;">
        <div style="display:flex; gap:6px; align-items:center;">
          <input
            v-for="i in indices"
            :key="i"
            v-bind="cellProps(i)"
            class="combo-input"
            style="width:36px; text-align:center; padding:6px 0;"
          />
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

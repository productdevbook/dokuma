import * as Vue from "vue"
import { createUseLabel } from "/dist/adapters/vue.mjs"

const useLabel = createUseLabel(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      ctx.onState("for=email")
      const label = useLabel({ htmlFor: "email" })
      return { labelProps: label.getRootProps() }
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:8px; padding:24px 0;">
        <label v-bind="labelProps" class="demo-label">Email</label>
        <input id="email" type="email" placeholder="ada@example.com" class="combo-input" style="max-width:280px;" />
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

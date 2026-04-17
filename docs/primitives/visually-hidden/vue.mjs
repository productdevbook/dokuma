import * as Vue from "vue"
import { createUseVisuallyHidden } from "/dist/adapters/vue.mjs"

const useVisuallyHidden = createUseVisuallyHidden(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      ctx.onState("hidden")
      const vh = useVisuallyHidden()
      return { vhProps: vh.getRootProps() }
    },
    template: `
      <div style="padding: 24px 0; display:flex; flex-direction:column; gap: 16px;">
        <button type="button" class="demo-trigger" style="display:inline-flex; align-items:center; gap:6px; width:fit-content;">
          <span aria-hidden="true">×</span>
          <span v-bind="vhProps">Close dialog</span>
        </button>
        <p style="opacity: 0.7;">The "Close dialog" label is hidden visually but still read by screen readers.</p>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

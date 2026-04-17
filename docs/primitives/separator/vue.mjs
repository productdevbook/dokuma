import * as Vue from "vue"
import { createUseSeparator } from "/dist/adapters/vue.mjs"

const useSeparator = createUseSeparator(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      ctx.onState("two separators mounted")
      const horiz = useSeparator({ orientation: "horizontal" })
      const vert = useSeparator({ orientation: "vertical" })
      return { horizProps: horiz.getRootProps(), vertProps: vert.getRootProps() }
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; padding:24px 0;">
        <div>Above</div>
        <div v-bind="horizProps" style="height: 1px; background: var(--border, #999);"></div>
        <div>Between</div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span>Left</span>
          <div v-bind="vertProps" style="width: 1px; height: 24px; background: var(--border, #999);"></div>
          <span>Right</span>
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

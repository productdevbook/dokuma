import * as Vue from "vue"
import { createUseAspectRatio } from "/dist/adapters/vue.mjs"

const useAspectRatio = createUseAspectRatio(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      ctx.onState("ratio: 16/9")
      const ar = useAspectRatio({ ratio: 16 / 9 })
      return { props: ar.getRootProps() }
    },
    template: `
      <div style="max-width:480px; padding:24px 0;">
        <div
          v-bind="props"
          :style="{ ...props.style, background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', borderRadius: '12px' }"
        ></div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

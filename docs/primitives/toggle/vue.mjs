import * as Vue from "vue"
import { createUseToggle } from "/dist/adapters/vue.mjs"

const useToggle = createUseToggle(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const tg = useToggle({
        defaultPressed: false,
        onPressedChange: (v) => ctx.onState(v ? "on" : "off"),
      })
      ctx.onState(tg.pressed.get() ? "on" : "off")
      return { rootProps: tg.rootProps }
    },
    template: `<button v-bind="rootProps" class="toggle">Bold</button>`,
  })
  app.mount(root)
  return () => app.unmount()
}

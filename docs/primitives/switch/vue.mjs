import * as Vue from "vue"
import { createUseSwitch } from "/dist/adapters/vue.mjs"

const useSwitch = createUseSwitch(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const sw = useSwitch({
        defaultChecked: false,
        onCheckedChange: (v) => ctx.onState(v ? "on" : "off"),
      })
      ctx.onState(sw.checked.get() ? "on" : "off")
      return {
        rootProps: sw.rootProps,
        thumbProps: sw.thumbProps,
        rootId: sw.rootId,
      }
    },
    template: `
      <div class="switch-row">
        <label :for="rootId" class="switch-label">Notifications</label>
        <button v-bind="rootProps" class="switch">
          <span v-bind="thumbProps" class="switch-thumb"></span>
        </button>
      </div>
    `,
  })

  app.mount(root)
  return () => app.unmount()
}

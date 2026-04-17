import * as Vue from "vue"
import { createUseCheckbox } from "/dist/adapters/vue.mjs"

const useCheckbox = createUseCheckbox(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const cb = useCheckbox({
        defaultChecked: false,
        onCheckedChange: (c) => ctx.onState(String(c)),
      })
      ctx.onState(String(cb.checked.get()))
      return {
        rootProps: cb.rootProps,
        indicatorProps: cb.indicatorProps,
        setIndeterminate: cb.setIndeterminate,
        check: cb.check,
        uncheck: cb.uncheck,
      }
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <label class="checkbox-row">
          <button v-bind="rootProps" class="checkbox">
            <span v-if="!indicatorProps.hidden" v-bind="indicatorProps" class="checkbox-indicator"></span>
          </button>
          <span>Subscribe to the newsletter</span>
        </label>
        <div style="display:flex; gap:8px;">
          <button class="dialog-button" @click="setIndeterminate">Set indeterminate</button>
          <button class="dialog-button" @click="check">Check</button>
          <button class="dialog-button" @click="uncheck">Uncheck</button>
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

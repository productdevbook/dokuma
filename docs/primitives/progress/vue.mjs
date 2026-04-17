import * as Vue from "vue"
import { createUseProgress } from "/dist/adapters/vue.mjs"

const useProgress = createUseProgress(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const p = useProgress({
        defaultValue: 30,
        onValueChange: (v) => ctx.onState(v === null ? "indeterminate" : `${v}%`),
      })
      const set = (v) => p.value.set(v)
      const initial = p.value.get()
      ctx.onState(initial === null ? "indeterminate" : `${initial}%`)
      return { rootProps: p.rootProps, indicatorProps: p.indicatorProps, set }
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div v-bind="rootProps" class="progress">
          <div v-bind="indicatorProps" class="progress-bar"></div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="dialog-button" @click="set(0)">0</button>
          <button class="dialog-button" @click="set(50)">50</button>
          <button class="dialog-button" @click="set(100)">100</button>
          <button class="dialog-button" @click="set(null)">Indeterminate</button>
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

import * as Vue from "vue"
import { createUseCollapsible } from "/dist/adapters/vue.mjs"

const useCollapsible = createUseCollapsible(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const c = useCollapsible({
        defaultOpen: false,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      ctx.onState(c.isOpen.value ? "open" : "closed")
      return { triggerProps: c.triggerProps, panelProps: c.panelProps }
    },
    template: `
      <div>
        <button v-bind="triggerProps" class="demo-trigger">Show details</button>
        <div v-bind="panelProps" class="demo-panel">
          <strong>Collapsible content.</strong>
          <p style="margin: 8px 0 0; color: var(--muted)">
            Same behavior as Disclosure under a different name.
          </p>
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

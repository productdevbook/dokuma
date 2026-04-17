import * as Vue from "vue"
import { createUseDisclosure } from "/dist/adapters/vue.mjs"

const useDisclosure = createUseDisclosure(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const d = useDisclosure({
        defaultOpen: false,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      ctx.onState(d.isOpen.value ? "open" : "closed")
      return {
        triggerProps: d.triggerProps,
        panelProps: d.panelProps,
      }
    },
    template: `
      <div>
        <button v-bind="triggerProps" class="demo-trigger">
          Toggle panel
        </button>
        <div v-bind="panelProps" class="demo-panel">
          <strong>Hello from the panel.</strong>
          <p style="margin: 8px 0 0; color: var(--muted)">
            The same primitive, the same ARIA wiring.
          </p>
        </div>
      </div>
    `,
  })

  app.mount(root)
  return () => app.unmount()
}

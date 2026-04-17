import * as Vue from "vue"
import { createUseTooltip } from "/dist/adapters/vue.mjs"

const useTooltip = createUseTooltip(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const tooltip = useTooltip({
        delayShow: 200,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      const triggerRef = Vue.ref(null)
      const contentRef = Vue.ref(null)

      Vue.onMounted(() => {
        const destroy = tooltip.mount({
          trigger: triggerRef.value,
          content: contentRef.value,
        })
        Vue.onScopeDispose(destroy)
      })

      ctx.onState(tooltip.isOpen.value ? "open" : "closed")
      return {
        triggerProps: tooltip.triggerProps,
        contentProps: tooltip.contentProps,
        isOpen: tooltip.isOpen,
        triggerRef,
        contentRef,
      }
    },
    template: `
      <div style="display:flex; gap:24px; padding:40px 0; justify-content:center;">
        <button
          ref="triggerRef"
          v-bind="triggerProps"
          class="demo-trigger"
          type="button"
        >Hover or focus me</button>
        <div
          ref="contentRef"
          v-bind="contentProps"
          class="tooltip"
          :style="{ visibility: isOpen ? 'visible' : 'hidden' }"
        >Save your changes</div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

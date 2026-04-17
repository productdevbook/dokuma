import * as Vue from "vue"
import { createUseHoverCard } from "/dist/adapters/vue.mjs"

const useHoverCard = createUseHoverCard(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const hc = useHoverCard({
        delayShow: 300,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      const triggerRef = Vue.ref(null)
      const contentRef = Vue.ref(null)
      Vue.onMounted(() => {
        const destroy = hc.mount({ trigger: triggerRef.value, content: contentRef.value })
        Vue.onScopeDispose(destroy)
      })
      ctx.onState(hc.isOpen.value ? "open" : "closed")
      return {
        triggerProps: hc.triggerProps,
        contentProps: hc.contentProps,
        isOpen: hc.isOpen,
        triggerRef,
        contentRef,
      }
    },
    template: `
      <div style="display:flex; gap:24px; padding:40px 0; justify-content:center;">
        <a ref="triggerRef" v-bind="triggerProps" href="#" class="demo-trigger" style="text-decoration:underline;">@ada</a>
        <div
          ref="contentRef"
          v-bind="contentProps"
          class="popover-content"
          :style="{ visibility: isOpen ? 'visible' : 'hidden', minWidth: '240px', padding: '12px' }"
        >
          <strong>Ada Lovelace</strong>
          <p style="margin: 6px 0 8px; color: var(--muted)">
            First programmer. Wrote the algorithm Babbage's Analytical Engine never ran.
          </p>
          <a href="#" style="text-decoration:underline;">Visit profile</a>
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

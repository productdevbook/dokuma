import * as Vue from "vue"
import { createUsePopover } from "/dist/adapters/vue.mjs"

const usePopover = createUsePopover(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const popover = usePopover({
        defaultOpen: false,
        side: "bottom",
        align: "center",
        sideOffset: 12,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      const triggerRef = Vue.ref(null)
      const contentRef = Vue.ref(null)

      Vue.watchEffect((onCleanup) => {
        if (!popover.isOpen.value || !triggerRef.value || !contentRef.value) return
        const destroy = popover.mount({
          trigger: triggerRef.value,
          content: contentRef.value,
        })
        onCleanup(destroy)
      })

      ctx.onState(popover.isOpen.value ? "open" : "closed")
      return {
        triggerProps: popover.triggerProps,
        contentProps: popover.contentProps,
        closeProps: popover.getCloseProps("Cancel"),
        isOpen: popover.isOpen,
        triggerRef,
        contentRef,
        hide: popover.hide,
      }
    },
    template: `
      <div>
        <div style="padding: 40px 0; display:flex; justify-content:center;">
          <button
            ref="triggerRef"
            v-bind="triggerProps"
            class="demo-trigger"
            type="button"
          >Open popover</button>
        </div>
        <template v-if="isOpen">
          <div ref="contentRef" v-bind="contentProps" class="popover">
            <h3 class="popover-title">Account</h3>
            <p class="popover-desc">Vue-driven Popover. Escape, click outside, or Cancel dismisses.</p>
            <div class="popover-actions">
              <button v-bind="closeProps" class="dialog-button">Cancel</button>
              <button @click="hide" class="dialog-button dialog-primary">Save</button>
            </div>
          </div>
        </template>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

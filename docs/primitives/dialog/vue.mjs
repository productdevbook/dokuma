import * as Vue from "vue"
import { createUseDialog, createUsePresence } from "/dist/adapters/vue.mjs"

const useDialog = createUseDialog(Vue)
const usePresence = createUsePresence(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const dialog = useDialog({
        defaultOpen: false,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      const triggerRef = Vue.ref(null)
      const contentRef = Vue.ref(null)
      const overlayRef = Vue.ref(null)

      const presence = usePresence(dialog.open, contentRef)

      Vue.watchEffect((onCleanup) => {
        if (!presence.isMounted.value || !contentRef.value) return
        const destroy = dialog.mount({
          trigger: triggerRef.value ?? undefined,
          content: contentRef.value,
          overlay: overlayRef.value ?? undefined,
        })
        onCleanup(destroy)
      })

      ctx.onState(dialog.isOpen.value ? "open" : "closed")
      return {
        triggerProps: dialog.triggerProps,
        contentProps: dialog.contentProps,
        overlayProps: dialog.overlayProps,
        titleProps: dialog.getTitleProps(),
        descProps: dialog.getDescriptionProps(),
        closeProps: dialog.getCloseProps("Cancel"),
        isMounted: presence.isMounted,
        triggerRef,
        contentRef,
        overlayRef,
        hide: dialog.hide,
      }
    },
    template: `
      <div>
        <button
          ref="triggerRef"
          v-bind="triggerProps"
          class="demo-trigger"
        >Open dialog</button>
        <Teleport to="body">
          <template v-if="isMounted">
            <div ref="overlayRef" v-bind="overlayProps" class="dialog-overlay"></div>
            <div ref="contentRef" v-bind="contentProps" class="dialog-content">
              <h2 v-bind="titleProps" class="dialog-title">Confirm</h2>
              <p v-bind="descProps" class="dialog-desc">
                Press Escape, click outside, or use Cancel to dismiss.
              </p>
              <div class="dialog-actions">
                <button v-bind="closeProps" class="dialog-button">Cancel</button>
                <button @click="hide" class="dialog-button dialog-primary">Confirm</button>
              </div>
            </div>
          </template>
        </Teleport>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

import * as Vue from "vue"
import { createUseAlertDialog, createUsePresence } from "/dist/adapters/vue.mjs"

const useAlertDialog = createUseAlertDialog(Vue)
const usePresence = createUsePresence(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const ad = useAlertDialog({
        defaultOpen: false,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      const triggerRef = Vue.ref(null)
      const contentRef = Vue.ref(null)
      const overlayRef = Vue.ref(null)

      const presence = usePresence(ad.open, contentRef)

      Vue.watchEffect((onCleanup) => {
        if (!presence.isMounted.value || !contentRef.value) return
        const destroy = ad.mount({
          trigger: triggerRef.value ?? undefined,
          content: contentRef.value,
          overlay: overlayRef.value ?? undefined,
        })
        onCleanup(destroy)
      })

      ctx.onState("closed")
      return {
        triggerProps: ad.triggerProps,
        contentProps: ad.contentProps,
        overlayProps: ad.overlayProps,
        titleProps: ad.getTitleProps(),
        descProps: ad.getDescriptionProps(),
        closeProps: ad.getCloseProps("Cancel"),
        isMounted: presence.isMounted,
        triggerRef,
        contentRef,
        overlayRef,
        confirm() {
          ctx.onState("confirmed")
          ad.hide()
        },
      }
    },
    template: `
      <div>
        <button ref="triggerRef" v-bind="triggerProps" class="demo-trigger">Delete account…</button>
        <Teleport to="body">
          <template v-if="isMounted">
            <div ref="overlayRef" v-bind="overlayProps" class="dialog-overlay"></div>
            <div ref="contentRef" v-bind="contentProps" class="dialog-content">
              <h2 v-bind="titleProps" class="dialog-title">Delete account?</h2>
              <p v-bind="descProps" class="dialog-desc">
                This action is irreversible. Outside-clicks won't dismiss — use a button.
              </p>
              <div class="dialog-actions">
                <button v-bind="closeProps" class="dialog-button">Cancel</button>
                <button @click="confirm" class="dialog-button dialog-primary">Delete</button>
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

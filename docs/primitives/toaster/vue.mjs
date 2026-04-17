import * as Vue from "vue"
import { createUseToaster } from "/dist/adapters/vue.mjs"

const useToaster = createUseToaster(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const toaster = useToaster({ duration: 4000 })
      const viewportRef = Vue.ref(null)

      Vue.onMounted(() => {
        if (!viewportRef.value) return
        const destroy = toaster.mount(viewportRef.value)
        Vue.onScopeDispose(destroy)
      })

      Vue.watchEffect(() => {
        ctx.onState(`${toaster.items.value.length} active`)
      })

      const showDefault = () => toaster.add("Saved successfully.")
      const showSuccess = () => toaster.add("Pull request merged.", { type: "success" })
      const showError = () =>
        toaster.add("Couldn't reach the server.", { type: "error", duration: Infinity })
      const showAction = () =>
        toaster.add("Item moved to trash.", {
          action: {
            label: "Undo",
            onClick: () => toaster.add("Restored.", { type: "success" }),
          },
        })

      return {
        items: toaster.items,
        viewportRef,
        showDefault,
        showSuccess,
        showError,
        showAction,
        getToastProps: toaster.getToastProps,
        getCloseProps: toaster.getCloseProps,
        getActionProps: toaster.getActionProps,
      }
    },
    template: `
      <div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; padding: 24px 0;">
          <button class="demo-trigger" type="button" @click="showDefault">Show toast</button>
          <button class="demo-trigger" type="button" @click="showSuccess">Success</button>
          <button class="demo-trigger" type="button" @click="showError">Error</button>
          <button class="demo-trigger" type="button" @click="showAction">With Undo</button>
        </div>
        <ol ref="viewportRef" class="toaster">
          <li
            v-for="item in items"
            :key="item.id"
            :id="getToastProps(item.id).id"
            :role="getToastProps(item.id).role"
            :data-type="getToastProps(item.id)['data-type']"
            :data-state="getToastProps(item.id)['data-state']"
            tabindex="0"
            class="toast"
            @mouseenter="getToastProps(item.id).onMouseEnter"
            @mouseleave="getToastProps(item.id).onMouseLeave"
            @focus="getToastProps(item.id).onFocus"
            @blur="getToastProps(item.id).onBlur"
          >
            <span class="toast-message">{{ item.message }}</span>
            <span class="toast-actions">
              <button
                v-if="item.action && getActionProps(item.id)"
                type="button"
                class="toast-action"
                @click="getActionProps(item.id).onClick"
              >{{ item.action.label }}</button>
              <button
                type="button"
                class="toast-close"
                :aria-label="getCloseProps(item.id)['aria-label']"
                @click="getCloseProps(item.id).onClick"
              >×</button>
            </span>
          </li>
        </ol>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

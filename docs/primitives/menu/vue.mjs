import * as Vue from "vue"
import { createUseMenu, createUseMenuItem } from "/dist/adapters/vue.mjs"

const useMenu = createUseMenu(Vue)
const useMenuItem = createUseMenuItem(Vue)

const ITEMS = [
  { value: "new", label: "New file" },
  { value: "open", label: "Open file…" },
  { value: "save", label: "Save", disabled: true },
  { value: "delete", label: "Delete" },
]

const Item = {
  props: ["menu", "value", "label", "disabled", "onSelectItem"],
  setup(props) {
    const { itemProps } = useMenuItem(props.menu, props.value, {
      label: props.label,
      disabled: props.disabled ? () => true : undefined,
      onSelect: () => props.onSelectItem(props.value),
    })
    return { itemProps }
  },
  template: `<button v-bind="itemProps" class="menu-item">{{ label }}</button>`,
}

export function mount(root, ctx) {
  const app = Vue.createApp({
    components: { Item },
    setup() {
      const menu = useMenu({
        defaultOpen: false,
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      const triggerRef = Vue.ref(null)
      const contentRef = Vue.ref(null)

      Vue.watchEffect((onCleanup) => {
        if (!menu.isOpen.value || !triggerRef.value || !contentRef.value) return
        const destroy = menu.mount({ trigger: triggerRef.value, content: contentRef.value })
        onCleanup(destroy)
      })

      const handleSelect = (v) => ctx.onState(`selected: ${v}`)

      ctx.onState("closed")
      return {
        triggerProps: menu.triggerProps,
        contentProps: menu.contentProps,
        isOpen: menu.isOpen,
        triggerRef,
        contentRef,
        items: ITEMS,
        menu,
        handleSelect,
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
          >Actions ▾</button>
        </div>
        <template v-if="isOpen">
          <div ref="contentRef" v-bind="contentProps" class="menu">
            <Item
              v-for="it in items"
              :key="it.value"
              :menu="menu"
              :value="it.value"
              :label="it.label"
              :disabled="it.disabled"
              :on-select-item="handleSelect"
            />
          </div>
        </template>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

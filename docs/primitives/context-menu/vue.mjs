import * as Vue from "vue"
import { createUseContextMenu, createUseMenuItem } from "/dist/adapters/vue.mjs"

const useContextMenu = createUseContextMenu(Vue)
const useMenuItem = createUseMenuItem(Vue)

const ITEMS = [
  { value: "cut", label: "Cut" },
  { value: "copy", label: "Copy" },
  { value: "paste", label: "Paste", disabled: true },
  { value: "delete", label: "Delete" },
]

const Item = {
  props: ["cm", "value", "label", "disabled", "onSelectItem"],
  setup(props) {
    const { itemProps } = useMenuItem(props.cm, props.value, {
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
      const cm = useContextMenu({
        onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
      })
      const anchorRef = Vue.ref(null)
      const contentRef = Vue.ref(null)

      Vue.onMounted(() => {
        if (!anchorRef.value || !contentRef.value) return
        const destroy = cm.mount({ anchor: anchorRef.value, content: contentRef.value })
        Vue.onScopeDispose(destroy)
      })

      const handleSelect = (v) => ctx.onState(`selected: ${v}`)

      ctx.onState("closed")
      return {
        anchorProps: cm.anchorProps,
        contentProps: cm.contentProps,
        isOpen: cm.isOpen,
        anchorRef,
        contentRef,
        items: ITEMS,
        cm,
        handleSelect,
      }
    },
    template: `
      <div>
        <div
          ref="anchorRef"
          v-bind="anchorProps"
          class="cm-anchor"
          style="padding: 80px 24px; border: 1px dashed var(--border, #999); border-radius: 8px; text-align: center; user-select: none;"
        >Right-click anywhere in this box (or long-press on touch).</div>
        <div
          ref="contentRef"
          v-bind="contentProps"
          class="menu"
          :style="{ visibility: isOpen ? 'visible' : 'hidden' }"
        >
          <Item
            v-for="it in items"
            :key="it.value"
            :cm="cm"
            :value="it.value"
            :label="it.label"
            :disabled="it.disabled"
            :on-select-item="handleSelect"
          />
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

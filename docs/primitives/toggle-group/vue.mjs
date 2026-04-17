import * as Vue from "vue"
import { createUseToggleGroup, createUseToggleGroupItem } from "/dist/adapters/vue.mjs"

const useToggleGroup = createUseToggleGroup(Vue)
const useToggleGroupItem = createUseToggleGroupItem(Vue)

const ITEMS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

const Item = {
  props: ["group", "value", "label"],
  setup(props) {
    const { itemProps } = useToggleGroupItem(props.group, props.value)
    return { itemProps }
  },
  template: `<button v-bind="itemProps" class="toggle">{{ label }}</button>`,
}

export function mount(root, ctx) {
  const app = Vue.createApp({
    components: { Item },
    setup() {
      const group = useToggleGroup({
        type: "single",
        defaultValue: "left",
        "aria-label": "Text alignment",
        onValueChange: (v) => ctx.onState(`pressed: ${v || "—"}`),
      })
      ctx.onState(`pressed: ${group.values.get()[0] ?? "—"}`)
      return { rootProps: group.rootProps, group, items: ITEMS }
    },
    template: `
      <div v-bind="rootProps" class="toggle-group">
        <Item v-for="it in items" :key="it.value" :group="group" :value="it.value" :label="it.label" />
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

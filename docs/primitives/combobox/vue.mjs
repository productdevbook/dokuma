import * as Vue from "vue"
import { createUseCombobox, createUseComboboxItem } from "/dist/adapters/vue.mjs"

const useCombobox = createUseCombobox(Vue)
const useComboboxItem = createUseComboboxItem(Vue)

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "apricot", label: "Apricot" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "dragonfruit", label: "Dragonfruit" },
  { value: "fig", label: "Fig" },
  { value: "grape", label: "Grape" },
  { value: "kiwi", label: "Kiwi" },
  { value: "lemon", label: "Lemon" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
  { value: "peach", label: "Peach" },
  { value: "pear", label: "Pear" },
  { value: "raspberry", label: "Raspberry" },
]

const ComboOption = {
  props: ["cb", "value", "label", "hidden"],
  setup(props) {
    const item = useComboboxItem(props.cb, props.value, { label: props.label })
    return { item }
  },
  template: `
    <li
      :id="item.optionProps.id"
      role="option"
      :aria-selected="item.optionProps['aria-selected']"
      :data-highlighted="item.optionProps['data-highlighted'] ? '' : undefined"
      :hidden="hidden"
      class="combo-option"
      @click="item.optionProps.onClick"
      @mouseenter="item.optionProps.onMouseenter"
    >{{ label }}</li>
  `,
}

export function mount(root, ctx) {
  const app = Vue.createApp({
    components: { ComboOption },
    setup() {
      const cb = useCombobox({
        onValueChange: (v) => ctx.onState(v ? `selected: ${v}` : "empty"),
      })
      const inputRef = Vue.ref(null)
      const listboxRef = Vue.ref(null)
      const triggerRef = Vue.ref(null)

      Vue.onMounted(() => {
        if (!inputRef.value || !listboxRef.value) return
        const destroy = cb.mount({
          input: inputRef.value,
          listbox: listboxRef.value,
          trigger: triggerRef.value ?? undefined,
        })
        Vue.onScopeDispose(destroy)
      })

      ctx.onState("empty")

      return {
        cb,
        inputRef,
        listboxRef,
        triggerRef,
        inputProps: cb.inputProps,
        isOpen: cb.isOpen,
        filtered: cb.filtered,
        empty: cb.empty,
        listboxId: cb.listboxId,
        FRUITS,
      }
    },
    template: `
      <div style="max-width: 360px; padding: 24px 0;">
        <div class="combo-shell">
          <input
            ref="inputRef"
            type="text"
            class="combo-input"
            placeholder="Pick a fruit…"
            v-bind="inputProps"
          />
          <button
            ref="triggerRef"
            type="button"
            class="combo-trigger"
            aria-hidden="true"
            tabindex="-1"
          >▾</button>
        </div>
        <ul
          ref="listboxRef"
          class="combo-listbox"
          :hidden="!isOpen"
          role="listbox"
          :id="listboxId"
        >
          <combo-option
            v-for="fruit in FRUITS"
            :key="fruit.value"
            :cb="cb"
            :value="fruit.value"
            :label="fruit.label"
            :hidden="!filtered.includes(fruit.value)"
          />
          <li v-if="isOpen && empty" class="combo-empty">No matches</li>
        </ul>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

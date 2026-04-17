import * as Vue from "vue"
import { createUseAccordion, createUseAccordionItem } from "/dist/adapters/vue.mjs"

const useAccordion = createUseAccordion(Vue)
const useAccordionItem = createUseAccordionItem(Vue)

const ITEMS = [
  {
    value: "a",
    title: "What is dokuma?",
    body: "Framework-agnostic, zero-deps headless UI primitives.",
  },
  {
    value: "b",
    title: "Why headless?",
    body: "Behavior + ARIA + keyboard come from the primitive. The look is yours.",
  },
  {
    value: "c",
    title: "Single vs multiple",
    body: "Single keeps at most one panel open. Multiple lets you open many.",
  },
]

const Item = {
  props: ["accordion", "value", "title", "body"],
  setup(props) {
    const { itemProps, triggerProps, panelProps } = useAccordionItem(props.accordion, props.value)
    return { itemProps, triggerProps, panelProps }
  },
  template: `
    <div v-bind="itemProps" class="acc-item">
      <button v-bind="triggerProps" class="acc-trigger">{{ title }}</button>
      <div v-bind="panelProps" class="acc-panel">{{ body }}</div>
    </div>
  `,
}

export function mount(root, ctx) {
  const app = Vue.createApp({
    components: { Item },
    setup() {
      const accordion = useAccordion({
        type: "single",
        defaultValue: "a",
        onValueChange: (v) => ctx.onState(`open: ${v || "—"}`),
      })
      ctx.onState(`open: ${accordion.values.get()[0] ?? "—"}`)
      return { accordion, items: ITEMS }
    },
    template: `
      <div class="acc">
        <Item
          v-for="it in items"
          :key="it.value"
          :accordion="accordion"
          :value="it.value"
          :title="it.title"
          :body="it.body"
        />
      </div>
    `,
  })

  app.mount(root)
  return () => app.unmount()
}

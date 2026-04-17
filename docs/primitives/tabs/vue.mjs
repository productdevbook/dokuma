import * as Vue from "vue"
import { createUseTab, createUseTabs } from "/dist/adapters/vue.mjs"

const useTabs = createUseTabs(Vue)
const useTab = createUseTab(Vue)

const TABS = [
  {
    value: "overview",
    title: "Overview",
    body: "The same headless tabs primitive every framework consumes.",
  },
  {
    value: "install",
    title: "Install",
    body: 'pnpm add dokuma, or esm.sh in a single <script type="module"> tag.',
  },
  {
    value: "api",
    title: "API",
    body: "One coordinator + per-tab register. ARIA, roving tabindex, keyboard for you.",
  },
]

const Trigger = {
  props: ["tabs", "value", "title"],
  setup(props) {
    const { tabProps } = useTab(props.tabs, props.value)
    return { tabProps }
  },
  template: `<button v-bind="tabProps" class="tabs-trigger">{{ title }}</button>`,
}

const Panel = {
  props: ["tabs", "value", "body"],
  setup(props) {
    const { panelProps } = useTab(props.tabs, props.value)
    return { panelProps }
  },
  template: `
    <div v-bind="panelProps" class="tabs-panel">
      <strong>Vue</strong>
      <p style="margin: 8px 0 0; color: var(--muted)">{{ body }}</p>
    </div>
  `,
}

export function mount(root, ctx) {
  const app = Vue.createApp({
    components: { Trigger, Panel },
    setup() {
      const tabs = useTabs({
        defaultValue: "overview",
        onValueChange: (v) => ctx.onState(`selected: ${v}`),
      })
      ctx.onState(`selected: ${tabs.value.get()}`)
      return { tabs, items: TABS, listProps: tabs.getListProps(), rootProps: tabs.getRootProps() }
    },
    template: `
      <div class="tabs" v-bind="rootProps">
        <div class="tabs-list" v-bind="listProps">
          <Trigger v-for="t in items" :key="t.value" :tabs="tabs" :value="t.value" :title="t.title" />
        </div>
        <Panel v-for="t in items" :key="t.value" :tabs="tabs" :value="t.value" :body="t.body" />
      </div>
    `,
  })

  app.mount(root)
  return () => app.unmount()
}

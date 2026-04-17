import * as Vue from "vue"
import { createUseRadioGroup, createUseRadioItem } from "/dist/adapters/vue.mjs"

const useRadioGroup = createUseRadioGroup(Vue)
const useRadioItem = createUseRadioItem(Vue)

const PLANS = [
  { value: "free", label: "Free", desc: "All the basics for getting started." },
  { value: "pro", label: "Pro", desc: "Everything in Free plus advanced features." },
  { value: "team", label: "Team", desc: "Collaboration tools and shared workspaces." },
]

const Item = {
  props: ["group", "value", "label", "desc"],
  setup(props) {
    const { itemProps } = useRadioItem(props.group, props.value)
    return { itemProps }
  },
  template: `
    <label class="radio-row">
      <button v-bind="itemProps" class="radio"></button>
      <div>
        <div style="font-weight:600;">{{ label }}</div>
        <div style="color:var(--muted); font-size:13px;">{{ desc }}</div>
      </div>
    </label>
  `,
}

export function mount(root, ctx) {
  const app = Vue.createApp({
    components: { Item },
    setup() {
      const group = useRadioGroup({
        defaultValue: "pro",
        "aria-label": "Plan",
        onValueChange: (v) => ctx.onState(`selected: ${v}`),
      })
      ctx.onState(`selected: ${group.value.get() || "—"}`)
      return { rootProps: group.rootProps, group, plans: PLANS }
    },
    template: `
      <div v-bind="rootProps" class="radio-group">
        <Item v-for="p in plans" :key="p.value" :group="group" :value="p.value" :label="p.label" :desc="p.desc" />
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}

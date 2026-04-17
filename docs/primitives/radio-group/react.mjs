import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseRadioGroup, createUseRadioItem } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useRadioGroup = createUseRadioGroup(React)
const useRadioItem = createUseRadioItem(React)

const PLANS = [
  { value: "free", label: "Free", desc: "All the basics for getting started." },
  { value: "pro", label: "Pro", desc: "Everything in Free plus advanced features." },
  { value: "team", label: "Team", desc: "Collaboration tools and shared workspaces." },
]

function Item({ group, value, label, desc }) {
  const { itemProps } = useRadioItem(group, value)
  return h(
    "label",
    { className: "radio-row" },
    h("button", { ...itemProps, className: "radio" }),
    h(
      "div",
      null,
      h("div", { style: { fontWeight: 600 } }, label),
      h("div", { style: { color: "var(--muted)", fontSize: 13 } }, desc),
    ),
  )
}

function Demo({ onState }) {
  const [value, setValue] = useState("pro")
  const group = useRadioGroup({
    value,
    "aria-label": "Plan",
    onValueChange: (v) => {
      setValue(v)
      onState(`selected: ${v}`)
    },
  })
  return h(
    "div",
    { ...group.getRootProps(), className: "radio-group" },
    PLANS.map((p) => h(Item, { key: p.value, group, ...p })),
  )
}

export function mount(root, ctx) {
  ctx.onState("selected: pro")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

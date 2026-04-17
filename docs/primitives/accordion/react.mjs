import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseAccordion, createUseAccordionItem } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useAccordion = createUseAccordion(React)
const useAccordionItem = createUseAccordionItem(React)

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

function Item({ accordion, value, title, body }) {
  const { itemProps, triggerProps, panelProps } = useAccordionItem(accordion, value)
  return h(
    "div",
    { ...itemProps, className: "acc-item" },
    h("button", { ...triggerProps, className: "acc-trigger" }, title),
    h("div", { ...panelProps, className: "acc-panel" }, body),
  )
}

function Demo({ onState }) {
  const [value, setValue] = useState("a")
  const accordion = useAccordion({
    type: "single",
    value,
    onValueChange: (v) => {
      setValue(v)
      onState(`open: ${v || "—"}`)
    },
  })

  return h(
    "div",
    { className: "acc" },
    ITEMS.map((it) =>
      h(Item, { key: it.value, accordion, value: it.value, title: it.title, body: it.body }),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("open: a")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

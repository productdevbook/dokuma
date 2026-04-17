import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseToggleGroup, createUseToggleGroupItem } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useToggleGroup = createUseToggleGroup(React)
const useToggleGroupItem = createUseToggleGroupItem(React)

const ITEMS = [
  { value: "bold", label: "B", title: "Bold" },
  { value: "italic", label: "I", title: "Italic" },
  { value: "underline", label: "U", title: "Underline" },
]

function Item({ group, value, label, title }) {
  const { itemProps } = useToggleGroupItem(group, value)
  return h("button", { ...itemProps, className: "toggle", title }, label)
}

function Demo({ onState }) {
  const [value, setValue] = useState([])
  const group = useToggleGroup({
    type: "multiple",
    value,
    onValueChange: (v) => {
      setValue(v)
      onState(`pressed: ${v.length ? v.join(",") : "—"}`)
    },
    "aria-label": "Text formatting",
  })

  return h(
    "div",
    { ...group.getRootProps(), className: "toggle-group" },
    ITEMS.map((it) => h(Item, { key: it.value, group, ...it })),
  )
}

export function mount(root, ctx) {
  ctx.onState("pressed: —")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

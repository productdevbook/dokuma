import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseCheckbox } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useCheckbox = createUseCheckbox(React)

function Demo({ onState }) {
  const [checked, setChecked] = useState(false)
  const cb = useCheckbox({
    checked,
    onCheckedChange: (c) => {
      setChecked(c)
      onState(String(c))
    },
  })
  const indicator = cb.getIndicatorProps()
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 14 } },
    h(
      "label",
      { className: "checkbox-row" },
      h(
        "button",
        { ...cb.getRootProps(), className: "checkbox" },
        indicator.hidden ? null : h("span", { ...indicator, className: "checkbox-indicator" }),
      ),
      h("span", null, "Subscribe to the newsletter"),
    ),
    h(
      "div",
      { style: { display: "flex", gap: 8 } },
      h(
        "button",
        { className: "dialog-button", onClick: () => setChecked("indeterminate") },
        "Set indeterminate",
      ),
      h("button", { className: "dialog-button", onClick: () => setChecked(true) }, "Check"),
      h("button", { className: "dialog-button", onClick: () => setChecked(false) }, "Uncheck"),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("false")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

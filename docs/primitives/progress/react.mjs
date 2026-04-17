import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseProgress } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useProgress = createUseProgress(React)

function Demo({ onState }) {
  const [value, setValue] = useState(30)
  const p = useProgress({
    value,
    onValueChange: (v) => onState(v === null ? "indeterminate" : `${v}%`),
  })

  const update = (v) => () => {
    setValue(v)
    onState(v === null ? "indeterminate" : `${v}%`)
  }

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 12 } },
    h(
      "div",
      { ...p.getRootProps(), className: "progress" },
      h("div", { ...p.getIndicatorProps(), className: "progress-bar" }),
    ),
    h(
      "div",
      { style: { display: "flex", gap: 8 } },
      h("button", { className: "dialog-button", onClick: update(0) }, "0"),
      h("button", { className: "dialog-button", onClick: update(50) }, "50"),
      h("button", { className: "dialog-button", onClick: update(100) }, "100"),
      h("button", { className: "dialog-button", onClick: update(null) }, "Indeterminate"),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("30%")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

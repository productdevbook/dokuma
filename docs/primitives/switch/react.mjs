import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseSwitch } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useSwitch = createUseSwitch(React)

function Demo({ onState }) {
  const [checked, setChecked] = useState(false)
  const sw = useSwitch({
    checked,
    onCheckedChange: (v) => {
      setChecked(v)
      onState(v ? "on" : "off")
    },
  })

  return h(
    "div",
    { className: "switch-row" },
    h("label", { htmlFor: sw.rootId, className: "switch-label" }, "Notifications"),
    h(
      "button",
      { ...sw.getRootProps(), className: "switch" },
      h("span", { ...sw.getThumbProps(), className: "switch-thumb" }),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("off")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseDisclosure } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useDisclosure = createUseDisclosure(React)

function Demo({ onState }) {
  const [open, setOpen] = useState(false)
  const d = useDisclosure({
    open,
    onOpenChange: (v) => {
      setOpen(v)
      onState(v ? "open" : "closed")
    },
  })

  return h(
    "div",
    null,
    h("button", { ...d.getTriggerProps(), className: "demo-trigger" }, "Toggle panel"),
    h(
      "div",
      { ...d.getPanelProps(), className: "demo-panel" },
      h("strong", null, "Hello from the panel."),
      h(
        "p",
        { style: { margin: "8px 0 0", color: "var(--muted)" } },
        "The same primitive, the same ARIA wiring.",
      ),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("closed")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

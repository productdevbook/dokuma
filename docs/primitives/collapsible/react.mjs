import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseCollapsible } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useCollapsible = createUseCollapsible(React)

function Demo({ onState }) {
  const [open, setOpen] = useState(false)
  const c = useCollapsible({
    open,
    onOpenChange: (v) => {
      setOpen(v)
      onState(v ? "open" : "closed")
    },
  })
  return h(
    "div",
    null,
    h("button", { ...c.getTriggerProps(), className: "demo-trigger" }, "Show details"),
    h(
      "div",
      { ...c.getPanelProps(), className: "demo-panel" },
      h("strong", null, "Collapsible content."),
      h(
        "p",
        { style: { margin: "8px 0 0", color: "var(--muted)" } },
        "Same behavior as Disclosure under a different name.",
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

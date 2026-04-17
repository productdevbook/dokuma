import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseVisuallyHidden } from "/dist/adapters/react.mjs"

const { createElement: h } = React
const useVisuallyHidden = createUseVisuallyHidden(React)

function Demo({ onState }) {
  React.useEffect(() => onState("hidden"), [onState])
  const vh = useVisuallyHidden()
  return h(
    "div",
    { style: { padding: "24px 0", display: "flex", flexDirection: "column", gap: 16 } },
    h(
      "button",
      {
        type: "button",
        className: "demo-trigger",
        style: { display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content" },
      },
      h("span", { "aria-hidden": true }, "\u00d7"),
      h("span", vh.getRootProps(), "Close dialog"),
    ),
    h(
      "p",
      { style: { opacity: 0.7 } },
      'The "Close dialog" label is hidden visually but still read by screen readers.',
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("loading")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

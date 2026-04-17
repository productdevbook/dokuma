import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseSeparator } from "/dist/adapters/react.mjs"

const { createElement: h } = React
const useSeparator = createUseSeparator(React)

function Demo({ onState }) {
  React.useEffect(() => onState("two separators mounted"), [onState])
  const horiz = useSeparator({ orientation: "horizontal" })
  const vert = useSeparator({ orientation: "vertical" })

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 12, padding: "24px 0" } },
    h("div", null, "Above"),
    h("div", {
      ...horiz.getRootProps(),
      style: { height: 1, background: "var(--border, #999)" },
    }),
    h("div", null, "Between"),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 12 } },
      h("span", null, "Left"),
      h("div", {
        ...vert.getRootProps(),
        style: { width: 1, height: 24, background: "var(--border, #999)" },
      }),
      h("span", null, "Right"),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("loading")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

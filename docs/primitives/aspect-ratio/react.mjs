import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseAspectRatio } from "/dist/adapters/react.mjs"

const { createElement: h } = React
const useAspectRatio = createUseAspectRatio(React)

function Demo({ onState }) {
  React.useEffect(() => onState("ratio: 16/9"), [onState])
  const ar = useAspectRatio({ ratio: 16 / 9 })
  return h(
    "div",
    { style: { maxWidth: 480, padding: "24px 0" } },
    h("div", {
      ...ar.getRootProps(),
      style: {
        ...ar.getRootProps().style,
        background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
        borderRadius: 12,
      },
    }),
  )
}

export function mount(root, ctx) {
  ctx.onState("loading")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

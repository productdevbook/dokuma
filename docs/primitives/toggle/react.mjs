import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseToggle } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useToggle = createUseToggle(React)

function Demo({ onState }) {
  const [pressed, setPressed] = useState(false)
  const tg = useToggle({
    pressed,
    onPressedChange: (v) => {
      setPressed(v)
      onState(v ? "on" : "off")
    },
  })
  return h("button", { ...tg.getRootProps(), className: "toggle" }, "Bold")
}

export function mount(root, ctx) {
  ctx.onState("off")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

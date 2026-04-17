import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseLabel } from "/dist/adapters/react.mjs"

const { createElement: h } = React
const useLabel = createUseLabel(React)

function Demo({ onState }) {
  React.useEffect(() => onState("htmlFor=email"), [onState])
  const label = useLabel({ htmlFor: "email" })
  // The primitive emits the DOM `for` attr; React JSX uses `htmlFor`.
  const props = label.getRootProps()
  const reactProps = props.for ? { ...props, htmlFor: props.for, for: undefined } : props
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 8, padding: "24px 0" } },
    h("label", { ...reactProps, className: "demo-label" }, "Email"),
    h("input", {
      id: "email",
      type: "email",
      placeholder: "ada@example.com",
      className: "combo-input",
      style: { maxWidth: 280 },
    }),
  )
}

export function mount(root, ctx) {
  ctx.onState("loading")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

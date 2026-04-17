import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseAvatar } from "/dist/adapters/react.mjs"

const { createElement: h } = React
const useAvatar = createUseAvatar(React)

function Demo({ onState }) {
  const a = useAvatar({
    src: "https://github.com/productdevbook.png?size=64",
    onStatusChange: onState,
  })
  return h(
    "div",
    { className: "avatar-row" },
    h(
      "div",
      { className: "avatar" },
      h("img", { ...a.getImageProps("Mehmet"), alt: "Mehmet" }),
      h("span", { ...a.getFallbackProps(), className: "avatar-fb" }, "MK"),
    ),
    h(
      "div",
      null,
      h("div", { style: { fontWeight: 600 } }, "Mehmet Kahya (React)"),
      h("div", { style: { color: "var(--muted)", fontSize: 13 } }, a.status.get()),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("idle")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

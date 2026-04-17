import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseTooltip } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef } = React
const useTooltip = createUseTooltip(React)

function Demo({ onState }) {
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const tooltip = useTooltip({
    delayShow: 200,
    onOpenChange: (v) => onState(v ? "open" : "closed"),
  })

  useEffect(() => {
    if (!triggerRef.current || !contentRef.current) return
    return tooltip.mount({ trigger: triggerRef.current, content: contentRef.current })
  }, [tooltip])

  return h(
    "div",
    { style: { display: "flex", gap: 24, padding: "40px 0", justifyContent: "center" } },
    h(
      "button",
      { ref: triggerRef, ...tooltip.getTriggerProps(), className: "demo-trigger", type: "button" },
      "Hover or focus me",
    ),
    h(
      "div",
      {
        ref: contentRef,
        ...tooltip.getContentProps(),
        className: "tooltip",
        style: { visibility: tooltip.open.get() ? "visible" : "hidden" },
      },
      "Save your changes",
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("closed")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

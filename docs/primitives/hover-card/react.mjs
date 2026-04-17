import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseHoverCard } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef } = React
const useHoverCard = createUseHoverCard(React)

function Demo({ onState }) {
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const hc = useHoverCard({
    delayShow: 300,
    onOpenChange: (v) => onState(v ? "open" : "closed"),
  })

  useEffect(() => {
    if (!triggerRef.current || !contentRef.current) return
    return hc.mount({ trigger: triggerRef.current, content: contentRef.current })
  }, [hc])

  return h(
    "div",
    { style: { display: "flex", gap: 24, padding: "40px 0", justifyContent: "center" } },
    h(
      "a",
      {
        ref: triggerRef,
        ...hc.getTriggerProps(),
        href: "#",
        className: "demo-trigger",
        style: { textDecoration: "underline" },
      },
      "@ada",
    ),
    h(
      "div",
      {
        ref: contentRef,
        ...hc.getContentProps(),
        className: "popover-content",
        style: {
          visibility: hc.open.get() ? "visible" : "hidden",
          minWidth: 240,
          padding: 12,
        },
      },
      h("strong", null, "Ada Lovelace"),
      h(
        "p",
        { style: { margin: "6px 0 8px", color: "var(--muted)" } },
        "First programmer. Wrote the algorithm Babbage's Analytical Engine never ran.",
      ),
      h("a", { href: "#", style: { textDecoration: "underline" } }, "Visit profile"),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("closed")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

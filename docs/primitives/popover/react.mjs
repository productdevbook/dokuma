import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUsePopover } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef, useState } = React
const usePopover = createUsePopover(React)

function Demo({ onState }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const popover = usePopover({
    open,
    side: "bottom",
    align: "center",
    sideOffset: 12,
    onOpenChange: (v) => {
      setOpen(v)
      onState(v ? "open" : "closed")
    },
  })

  useEffect(() => {
    if (!triggerRef.current) return
    if (!open || !contentRef.current) {
      // mount only when content exists (it's only rendered when open)
      return
    }
    return popover.mount({ trigger: triggerRef.current, content: contentRef.current })
  }, [popover, open])

  return h(
    "div",
    null,
    h(
      "div",
      { style: { padding: "40px 0", display: "flex", justifyContent: "center" } },
      h(
        "button",
        {
          ref: triggerRef,
          ...popover.getTriggerProps(),
          className: "demo-trigger",
          type: "button",
        },
        "Open popover",
      ),
    ),
    open
      ? h(
          "div",
          { ref: contentRef, ...popover.getContentProps(), className: "popover" },
          h("h3", { className: "popover-title" }, "Account"),
          h(
            "p",
            { className: "popover-desc" },
            "Manage your account settings. Escape or click outside to dismiss.",
          ),
          h(
            "div",
            { className: "popover-actions" },
            h("button", { ...popover.getCloseProps(), className: "dialog-button" }, "Cancel"),
            h(
              "button",
              { className: "dialog-button dialog-primary", onClick: () => popover.hide() },
              "Save",
            ),
          ),
        )
      : null,
  )
}

export function mount(root, ctx) {
  ctx.onState("closed")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

import * as React from "react"
import { createPortal } from "react-dom"
import { createRoot } from "react-dom/client"
import { createUseAlertDialog, createUsePresence } from "/dist/adapters/react.mjs"
import { getDefaultPortalTarget } from "/dist/index.mjs"

const { createElement: h, useEffect, useRef, useState } = React
const useAlertDialog = createUseAlertDialog(React)
const usePresence = createUsePresence(React)

function Demo({ onState }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const overlayRef = useRef(null)

  const ad = useAlertDialog({
    open,
    onOpenChange: (v) => {
      setOpen(v)
      onState(v ? "open" : "closed")
    },
  })

  const presence = usePresence(ad.open, contentRef)

  useEffect(() => {
    if (!presence.isMounted) return
    if (!contentRef.current) return
    return ad.mount({
      trigger: triggerRef.current,
      content: contentRef.current,
      overlay: overlayRef.current,
    })
  }, [presence.isMounted, ad])

  const portalTarget = getDefaultPortalTarget()
  const overlay = presence.isMounted
    ? h(
        "div",
        null,
        h("div", {
          ref: overlayRef,
          ...ad.getOverlayProps(),
          className: "dialog-overlay",
        }),
        h(
          "div",
          { ref: contentRef, ...ad.getContentProps(), className: "dialog-content" },
          h("h2", { ...ad.getTitleProps(), className: "dialog-title" }, "Delete account?"),
          h(
            "p",
            { ...ad.getDescriptionProps(), className: "dialog-desc" },
            "This action is irreversible. Outside-clicks won't dismiss — use a button.",
          ),
          h(
            "div",
            { className: "dialog-actions" },
            h("button", { ...ad.getCloseProps("Cancel"), className: "dialog-button" }, "Cancel"),
            h(
              "button",
              {
                className: "dialog-button dialog-primary",
                onClick: () => {
                  onState("confirmed")
                  ad.hide()
                },
              },
              "Delete",
            ),
          ),
        ),
      )
    : null

  return h(
    "div",
    null,
    h(
      "button",
      { ref: triggerRef, ...ad.getTriggerProps(), className: "demo-trigger" },
      "Delete account…",
    ),
    overlay && portalTarget ? createPortal(overlay, portalTarget) : overlay,
  )
}

export function mount(root, ctx) {
  ctx.onState("closed")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

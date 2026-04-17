import * as React from "react"
import { createPortal } from "react-dom"
import { createRoot } from "react-dom/client"
import { createUseDialog, createUsePresence } from "/dist/adapters/react.mjs"
import { getDefaultPortalTarget } from "/dist/index.mjs"

const { createElement: h, useEffect, useRef, useState } = React
const useDialog = createUseDialog(React)
const usePresence = createUsePresence(React)

function Demo({ onState }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const overlayRef = useRef(null)

  const dialog = useDialog({
    open,
    onOpenChange: (v) => {
      setOpen(v)
      onState(v ? "open" : "closed")
    },
  })

  const presence = usePresence(dialog.open, contentRef)

  useEffect(() => {
    if (!presence.isMounted) return
    if (!contentRef.current) return
    const destroy = dialog.mount({
      trigger: triggerRef.current,
      content: contentRef.current,
      overlay: overlayRef.current,
    })
    return destroy
  }, [presence.isMounted, dialog])

  const portalTarget = getDefaultPortalTarget()

  const overlay = presence.isMounted
    ? h(
        "div",
        null,
        h("div", {
          ref: overlayRef,
          ...dialog.getOverlayProps(),
          className: "dialog-overlay",
        }),
        h(
          "div",
          { ref: contentRef, ...dialog.getContentProps(), className: "dialog-content" },
          h("h2", { ...dialog.getTitleProps(), className: "dialog-title" }, "Confirm"),
          h(
            "p",
            { ...dialog.getDescriptionProps(), className: "dialog-desc" },
            "Press Escape, click outside, or use Cancel to dismiss.",
          ),
          h(
            "div",
            { className: "dialog-actions" },
            h(
              "button",
              { ...dialog.getCloseProps("Cancel"), className: "dialog-button" },
              "Cancel",
            ),
            h(
              "button",
              { className: "dialog-button dialog-primary", onClick: () => dialog.hide() },
              "Confirm",
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
      { ref: triggerRef, ...dialog.getTriggerProps(), className: "demo-trigger" },
      "Open dialog",
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

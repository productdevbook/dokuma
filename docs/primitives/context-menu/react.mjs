import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseContextMenu, createUseMenuItem } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef } = React
const useContextMenu = createUseContextMenu(React)
const useMenuItem = createUseMenuItem(React)

const ITEMS = [
  { value: "cut", label: "Cut" },
  { value: "copy", label: "Copy" },
  { value: "paste", label: "Paste", disabled: true },
  { value: "delete", label: "Delete" },
]

function Item({ cm, value, label, disabled, onSelect }) {
  const { itemProps } = useMenuItem(cm, value, {
    label,
    disabled: disabled ? () => true : undefined,
    onSelect,
  })
  return h("button", { ...itemProps, className: "menu-item" }, label)
}

function Demo({ onState }) {
  const anchorRef = useRef(null)
  const contentRef = useRef(null)
  const cm = useContextMenu({
    onOpenChange: (v) => onState(v ? "open" : "closed"),
  })

  useEffect(() => {
    if (!anchorRef.current || !contentRef.current) return
    return cm.mount({ anchor: anchorRef.current, content: contentRef.current })
  }, [cm])

  const isOpen = cm.open.get()

  return h(
    "div",
    null,
    h(
      "div",
      {
        ref: anchorRef,
        ...cm.getAnchorProps(),
        className: "cm-anchor",
        style: {
          padding: "80px 24px",
          border: "1px dashed var(--border, #999)",
          borderRadius: 8,
          textAlign: "center",
          userSelect: "none",
        },
      },
      "Right-click anywhere in this box (or long-press on touch).",
    ),
    h(
      "div",
      {
        ref: contentRef,
        ...cm.getContentProps(),
        className: "menu",
        style: { visibility: isOpen ? "visible" : "hidden" },
      },
      ITEMS.map((it) =>
        h(Item, {
          key: it.value,
          cm,
          ...it,
          onSelect: () => onState(`selected: ${it.value}`),
        }),
      ),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("closed")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

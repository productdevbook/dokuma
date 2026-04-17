import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseMenu, createUseMenuItem } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef, useState } = React
const useMenu = createUseMenu(React)
const useMenuItem = createUseMenuItem(React)

const ITEMS = [
  { value: "new", label: "New file" },
  { value: "open", label: "Open file…" },
  { value: "save", label: "Save", disabled: true },
  { value: "delete", label: "Delete" },
]

function Item({ menu, value, label, disabled, onSelect }) {
  const { itemProps } = useMenuItem(menu, value, {
    label,
    disabled: disabled ? () => true : undefined,
    onSelect,
  })
  return h("button", { ...itemProps, className: "menu-item" }, label)
}

function Demo({ onState }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const menu = useMenu({
    open,
    onOpenChange: (v) => {
      setOpen(v)
      onState(v ? "open" : "closed")
    },
  })

  useEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return
    return menu.mount({ trigger: triggerRef.current, content: contentRef.current })
  }, [menu, open])

  return h(
    "div",
    null,
    h(
      "div",
      { style: { padding: "40px 0", display: "flex", justifyContent: "center" } },
      h(
        "button",
        { ref: triggerRef, ...menu.getTriggerProps(), className: "demo-trigger", type: "button" },
        "Actions ▾",
      ),
    ),
    open
      ? h(
          "div",
          { ref: contentRef, ...menu.getContentProps(), className: "menu" },
          ITEMS.map((it) =>
            h(Item, {
              key: it.value,
              menu,
              ...it,
              onSelect: () => onState(`selected: ${it.value}`),
            }),
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

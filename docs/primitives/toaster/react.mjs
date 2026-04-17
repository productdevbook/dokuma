import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseToaster } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef } = React
const useToaster = createUseToaster(React)

function Toast({ item, toaster }) {
  const props = toaster.getToastProps(item.id)
  const close = toaster.getCloseProps(item.id)
  const action = toaster.getActionProps(item.id)
  return h(
    "li",
    {
      id: props.id,
      role: props.role,
      "data-type": props["data-type"],
      "data-state": props["data-state"],
      tabIndex: 0,
      className: "toast",
      onMouseEnter: props.onMouseEnter,
      onMouseLeave: props.onMouseLeave,
      onFocus: props.onFocus,
      onBlur: props.onBlur,
    },
    h("span", { className: "toast-message" }, item.message),
    h(
      "span",
      { className: "toast-actions" },
      action && item.action
        ? h(
            "button",
            {
              type: "button",
              className: "toast-action",
              onClick: action.onClick,
            },
            item.action.label,
          )
        : null,
      h(
        "button",
        {
          type: "button",
          className: "toast-close",
          "aria-label": close["aria-label"],
          onClick: close.onClick,
        },
        "×",
      ),
    ),
  )
}

function Demo({ onState }) {
  const toaster = useToaster({ duration: 4000 })
  const viewportRef = useRef(null)

  useEffect(() => {
    if (!viewportRef.current) return
    return toaster.mount(viewportRef.current)
  }, [toaster])

  const items = toaster.toasts.get()
  useEffect(() => {
    onState(`${items.length} active`)
  }, [items.length, onState])

  return h(
    "div",
    null,
    h(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", padding: "24px 0" } },
      h(
        "button",
        {
          type: "button",
          className: "demo-trigger",
          onClick: () => toaster.add("Saved successfully."),
        },
        "Show toast",
      ),
      h(
        "button",
        {
          type: "button",
          className: "demo-trigger",
          onClick: () => toaster.add("Pull request merged.", { type: "success" }),
        },
        "Success",
      ),
      h(
        "button",
        {
          type: "button",
          className: "demo-trigger",
          onClick: () =>
            toaster.add("Couldn't reach the server.", { type: "error", duration: Infinity }),
        },
        "Error",
      ),
      h(
        "button",
        {
          type: "button",
          className: "demo-trigger",
          onClick: () =>
            toaster.add("Item moved to trash.", {
              action: {
                label: "Undo",
                onClick: () => toaster.add("Restored.", { type: "success" }),
              },
            }),
        },
        "With Undo",
      ),
    ),
    h(
      "ol",
      { ref: viewportRef, className: "toaster" },
      items.map((item) => h(Toast, { key: item.id, item, toaster })),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("0 active")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

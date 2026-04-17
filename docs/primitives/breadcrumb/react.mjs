import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseBreadcrumb } from "/dist/adapters/react.mjs"

const { createElement: h } = React
const useBreadcrumb = createUseBreadcrumb(React)

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/docs/primitives", label: "Primitives" },
  { label: "Breadcrumb" },
]

function Demo({ onState }) {
  React.useEffect(() => onState(`${ITEMS.length} items`), [onState])
  const bc = useBreadcrumb()

  return h(
    "nav",
    bc.getRootProps(),
    h(
      "ol",
      { style: { display: "flex", gap: 6, listStyle: "none", padding: 0, margin: 0 } },
      ITEMS.flatMap((item, i) => {
        const isLast = i === ITEMS.length - 1
        const itemProps = bc.getItemProps({ current: isLast })
        const cell = h(
          "li",
          { key: `i${i}` },
          item.href && !isLast
            ? h("a", { href: item.href, style: { textDecoration: "underline" } }, item.label)
            : h(
                "span",
                {
                  ...itemProps,
                  style: itemProps["aria-current"] ? { fontWeight: 600 } : null,
                },
                item.label,
              ),
        )
        if (isLast) return [cell]
        return [
          cell,
          h("li", { key: `s${i}`, ...bc.getSeparatorProps(), style: { opacity: 0.5 } }, "/"),
        ]
      }),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("loading")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

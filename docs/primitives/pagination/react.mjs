import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUsePagination } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const usePagination = createUsePagination(React)

function Demo({ onState }) {
  const [page, setPage] = useState(1)
  const p = usePagination({
    pageCount: 12,
    page,
    onPageChange: (n) => {
      setPage(n)
      onState(`page ${n}`)
    },
  })

  const items = p.pages.get()
  const prev = p.getPrevProps()
  const next = p.getNextProps()

  const btnStyle = { padding: "4px 10px", borderRadius: 6 }

  return h(
    "div",
    { style: { padding: "24px 0" } },
    h(
      "nav",
      p.getRootProps(),
      h(
        "ul",
        {
          style: {
            display: "flex",
            gap: 6,
            listStyle: "none",
            padding: 0,
            margin: 0,
            alignItems: "center",
          },
        },
        h("li", null, h("button", { ...prev, style: btnStyle }, "‹")),
        items.map((it, i) => {
          if (it === "ellipsis") {
            return h("li", { key: `e${i}`, style: { opacity: 0.5, padding: "4px 6px" } }, "…")
          }
          const ip = p.getItemProps(it)
          return h(
            "li",
            { key: it },
            h(
              "button",
              {
                ...ip,
                style: { ...btnStyle, fontWeight: ip["aria-current"] ? 600 : 400 },
              },
              it,
            ),
          )
        }),
        h("li", null, h("button", { ...next, style: btnStyle }, "›")),
      ),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("page 1")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

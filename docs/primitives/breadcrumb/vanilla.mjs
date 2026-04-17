import { mountBreadcrumb } from "/dist/adapters/vanilla.mjs"

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/docs/primitives", label: "Primitives" },
  { label: "Breadcrumb" },
]

export function mount(root, ctx) {
  root.innerHTML = `<nav id="bc-root"><ol id="bc-list" style="display:flex; gap:6px; list-style:none; padding:0; margin:0;"></ol></nav>`

  const list = root.querySelector("#bc-list")
  const { breadcrumb, destroy } = mountBreadcrumb({ root: "#bc-root", parent: root })

  ITEMS.forEach((item, i) => {
    const li = document.createElement("li")
    const isLast = i === ITEMS.length - 1
    const itemProps = breadcrumb.getItemProps({ current: isLast })
    if (item.href && !isLast) {
      const a = document.createElement("a")
      a.href = item.href
      a.textContent = item.label
      a.style.textDecoration = "underline"
      li.append(a)
    } else {
      const span = document.createElement("span")
      span.textContent = item.label
      if (itemProps["aria-current"]) {
        span.setAttribute("aria-current", itemProps["aria-current"])
        span.style.fontWeight = "600"
      }
      li.append(span)
    }
    list.append(li)
    if (!isLast) {
      const sep = document.createElement("li")
      const sepProps = breadcrumb.getSeparatorProps()
      sep.setAttribute("aria-hidden", String(sepProps["aria-hidden"]))
      sep.setAttribute("role", sepProps.role)
      sep.textContent = "/"
      sep.style.opacity = "0.5"
      list.append(sep)
    }
  })

  ctx.onState(`${ITEMS.length} items`)
  return destroy
}

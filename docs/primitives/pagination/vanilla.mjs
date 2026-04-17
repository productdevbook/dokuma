import { mountPagination } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="padding: 24px 0;">
      <nav id="pg-nav">
        <ul id="pg-list" style="display:flex; gap:6px; list-style:none; padding:0; margin:0; align-items:center;"></ul>
      </nav>
    </div>
  `
  const list = root.querySelector("#pg-list")

  const { pagination, destroy } = mountPagination({
    root: "#pg-nav",
    parent: root,
    pageCount: 12,
    defaultPage: 1,
    onPageChange: (n) => ctx.onState(`page ${n}`),
  })

  const render = () => {
    list.innerHTML = ""
    const prev = pagination.getPrevProps()
    const next = pagination.getNextProps()
    const items = pagination.pages.get()

    const mkBtn = (label, props, extra = {}) => {
      const li = document.createElement("li")
      const btn = document.createElement("button")
      btn.type = "button"
      btn.textContent = label
      btn.setAttribute("aria-label", props["aria-label"])
      if (props.disabled) btn.disabled = true
      if (props["aria-current"]) {
        btn.setAttribute("aria-current", props["aria-current"])
        btn.style.fontWeight = "600"
      }
      Object.assign(btn.style, { padding: "4px 10px", borderRadius: "6px", ...extra })
      btn.addEventListener("click", props.onClick)
      li.append(btn)
      return li
    }

    list.append(mkBtn("‹", prev))
    for (const it of items) {
      if (it === "ellipsis") {
        const li = document.createElement("li")
        li.textContent = "…"
        li.style.opacity = "0.5"
        li.style.padding = "4px 6px"
        list.append(li)
      } else {
        list.append(mkBtn(String(it), pagination.getItemProps(it)))
      }
    }
    list.append(mkBtn("›", next))
  }

  render()
  const u1 = pagination.page.subscribe(render)
  ctx.onState(`page ${pagination.page.get()}`)
  return () => {
    u1()
    destroy()
  }
}

import { mountMenu } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="padding: 40px 0; display:flex; justify-content:center;">
      <button id="m-trigger" class="demo-trigger" type="button">Actions ▾</button>
    </div>
    <div id="m-content" class="menu" hidden></div>
  `
  const content = root.querySelector("#m-content")
  // build items
  const items = [
    { value: "new", label: "New file" },
    { value: "open", label: "Open file…" },
    { value: "save", label: "Save", disabled: true },
    { value: "delete", label: "Delete" },
  ]
  for (const it of items) {
    const btn = document.createElement("button")
    btn.id = `m-${it.value}`
    btn.className = "menu-item"
    btn.textContent = it.label
    btn.type = "button"
    content.append(btn)
  }
  content.removeAttribute("hidden")
  content.style.visibility = "hidden"

  const { menu, destroy } = mountMenu({
    trigger: "#m-trigger",
    content: "#m-content",
    parent: root,
    onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
  })

  // wire item handles + onSelect with the primitive's registerItem
  for (const it of items) {
    const btn = root.querySelector(`#m-${it.value}`)
    const handle = menu.registerItem(it.value, {
      label: it.label,
      disabled: it.disabled ? () => true : undefined,
      onSelect: () => ctx.onState(`selected: ${it.value}`),
    })
    btn.id = handle.itemId
    btn.addEventListener("click", () => menu.select(it.value))
    btn.addEventListener("mouseenter", () => menu.setHighlighted(it.value))
  }

  const sync = (open) => {
    content.style.visibility = open ? "visible" : "hidden"
  }
  sync(menu.open.get())
  const unsubOpen = menu.open.subscribe(sync)

  ctx.onState("closed")
  return () => {
    unsubOpen()
    destroy()
  }
}

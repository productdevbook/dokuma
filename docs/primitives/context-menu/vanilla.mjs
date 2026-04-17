import { mountContextMenu } from "/dist/adapters/vanilla.mjs"

const ITEMS = [
  { value: "cut", label: "Cut" },
  { value: "copy", label: "Copy" },
  { value: "paste", label: "Paste", disabled: true },
  { value: "delete", label: "Delete" },
]

export function mount(root, ctx) {
  root.innerHTML = `
    <div
      id="cm-anchor"
      class="cm-anchor"
      style="
        padding: 80px 24px;
        border: 1px dashed var(--border, #999);
        border-radius: 8px;
        text-align: center;
        user-select: none;
      "
    >Right-click anywhere in this box (or long-press on touch).</div>
    <div id="cm-content" class="menu" hidden></div>
  `

  const content = root.querySelector("#cm-content")
  for (const it of ITEMS) {
    const btn = document.createElement("button")
    btn.id = `cm-${it.value}`
    btn.className = "menu-item"
    btn.textContent = it.label
    btn.type = "button"
    content.append(btn)
  }
  content.removeAttribute("hidden")
  content.style.visibility = "hidden"

  const { contextMenu, destroy } = mountContextMenu({
    anchor: "#cm-anchor",
    content: "#cm-content",
    parent: root,
    onOpenChange: (v) => ctx.onState(v ? "open" : "closed"),
  })

  for (const it of ITEMS) {
    const btn = root.querySelector(`#cm-${it.value}`)
    const handle = contextMenu.registerItem(it.value, {
      label: it.label,
      disabled: it.disabled ? () => true : undefined,
      onSelect: () => ctx.onState(`selected: ${it.value}`),
    })
    btn.id = handle.itemId
    btn.addEventListener("click", () => contextMenu.select(it.value))
    btn.addEventListener("mouseenter", () => contextMenu.setHighlighted(it.value))
  }

  const sync = (open) => {
    content.style.visibility = open ? "visible" : "hidden"
  }
  sync(contextMenu.open.get())
  const unsubOpen = contextMenu.open.subscribe(sync)

  ctx.onState("closed")
  return () => {
    unsubOpen()
    destroy()
  }
}

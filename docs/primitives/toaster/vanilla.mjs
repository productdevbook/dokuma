import { mountToaster } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="display:flex; gap:8px; flex-wrap:wrap; padding: 24px 0;">
      <button id="t-default" class="demo-trigger" type="button">Show toast</button>
      <button id="t-success" class="demo-trigger" type="button">Success</button>
      <button id="t-error" class="demo-trigger" type="button">Error</button>
      <button id="t-action" class="demo-trigger" type="button">With Undo</button>
    </div>
    <ol id="t-viewport" class="toaster"></ol>
  `

  const viewport = root.querySelector("#t-viewport")
  const { toaster, destroy } = mountToaster({
    viewport,
    parent: root,
    duration: 4000,
  })

  const render = () => {
    const items = toaster.toasts.get()
    viewport.innerHTML = ""
    for (const item of items) {
      const props = toaster.getToastProps(item.id)
      const li = document.createElement("li")
      li.id = props.id
      li.className = "toast"
      li.setAttribute("role", props.role)
      li.setAttribute("data-type", props["data-type"])
      li.setAttribute("data-state", props["data-state"])
      li.tabIndex = 0
      li.addEventListener("mouseenter", props.onMouseEnter)
      li.addEventListener("mouseleave", props.onMouseLeave)
      li.addEventListener("focus", props.onFocus)
      li.addEventListener("blur", props.onBlur)
      li.innerHTML = `
        <span class="toast-message">${item.message}</span>
        <span class="toast-actions"></span>
      `
      const actions = li.querySelector(".toast-actions")
      const action = toaster.getActionProps(item.id)
      if (action && item.action) {
        const btn = document.createElement("button")
        btn.type = "button"
        btn.className = "toast-action"
        btn.textContent = item.action.label
        btn.addEventListener("click", action.onClick)
        actions.append(btn)
      }
      const close = toaster.getCloseProps(item.id)
      const closeBtn = document.createElement("button")
      closeBtn.type = "button"
      closeBtn.className = "toast-close"
      closeBtn.setAttribute("aria-label", close["aria-label"])
      closeBtn.textContent = "×"
      closeBtn.addEventListener("click", close.onClick)
      actions.append(closeBtn)
      viewport.append(li)
    }
    ctx.onState(`${items.length} active`)
  }

  const unsub = toaster.toasts.subscribe(render)
  render()

  root.querySelector("#t-default").addEventListener("click", () => {
    toaster.add("Saved successfully.")
  })
  root.querySelector("#t-success").addEventListener("click", () => {
    toaster.add("Pull request merged.", { type: "success" })
  })
  root.querySelector("#t-error").addEventListener("click", () => {
    toaster.add("Couldn't reach the server.", { type: "error", duration: Infinity })
  })
  root.querySelector("#t-action").addEventListener("click", () => {
    toaster.add("Item moved to trash.", {
      action: {
        label: "Undo",
        onClick: () => toaster.add("Restored.", { type: "success" }),
      },
    })
  })

  return () => {
    unsub()
    destroy()
  }
}

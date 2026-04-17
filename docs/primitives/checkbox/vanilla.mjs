import { mountCheckbox } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <label class="checkbox-row">
        <button id="cb-1" class="checkbox">
          <span class="checkbox-indicator"></span>
        </button>
        <span>Subscribe to the newsletter</span>
      </label>
      <div style="display:flex; gap:8px;">
        <button id="cb-set-i" class="dialog-button">Set indeterminate</button>
        <button id="cb-check" class="dialog-button">Check</button>
        <button id="cb-uncheck" class="dialog-button">Uncheck</button>
      </div>
    </div>
  `
  const { checkbox, destroy } = mountCheckbox({
    root: "#cb-1",
    parent: root,
    defaultChecked: false,
    onCheckedChange: (c) => ctx.onState(String(c)),
  })

  // toggle indicator visibility based on state
  const indicator = root.querySelector(".checkbox-indicator")
  const sync = (c) => {
    if (c === false) indicator.setAttribute("hidden", "")
    else indicator.removeAttribute("hidden")
    indicator.setAttribute(
      "data-state",
      c === "indeterminate" ? "indeterminate" : c ? "checked" : "unchecked",
    )
  }
  sync(checkbox.checked.get())
  const unsub = checkbox.checked.subscribe(sync)

  ctx.onState(String(checkbox.checked.get()))
  root.querySelector("#cb-set-i").addEventListener("click", () => checkbox.setIndeterminate())
  root.querySelector("#cb-check").addEventListener("click", () => checkbox.check())
  root.querySelector("#cb-uncheck").addEventListener("click", () => checkbox.uncheck())

  return () => {
    unsub()
    destroy()
  }
}

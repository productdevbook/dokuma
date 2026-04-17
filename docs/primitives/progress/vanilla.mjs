import { mountProgress } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div id="pg-root" class="progress">
        <div id="pg-bar" class="progress-bar"></div>
      </div>
      <div style="display:flex; gap:8px;">
        <button id="pg-zero" class="dialog-button">0</button>
        <button id="pg-half" class="dialog-button">50</button>
        <button id="pg-full" class="dialog-button">100</button>
        <button id="pg-ind" class="dialog-button">Indeterminate</button>
      </div>
    </div>
  `
  const { progress, destroy } = mountProgress({
    root: "#pg-root",
    indicator: "#pg-bar",
    parent: root,
    defaultValue: 30,
    onValueChange: (v) => ctx.onState(v === null ? "indeterminate" : `${v}%`),
  })
  ctx.onState(progress.value.get() === null ? "indeterminate" : `${progress.value.get()}%`)

  const set = (v) => () => progress.value.set(v)
  const offs = [
    [root.querySelector("#pg-zero"), "click", set(0)],
    [root.querySelector("#pg-half"), "click", set(50)],
    [root.querySelector("#pg-full"), "click", set(100)],
    [root.querySelector("#pg-ind"), "click", set(null)],
  ]
  for (const [el, evt, fn] of offs) el.addEventListener(evt, fn)

  return () => {
    for (const [el, evt, fn] of offs) el.removeEventListener(evt, fn)
    destroy()
  }
}

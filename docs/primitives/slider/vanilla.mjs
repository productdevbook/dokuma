import { mountSlider } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div id="sl-root" class="slider">
      <div id="sl-track" class="slider-track">
        <div id="sl-range" class="slider-range"></div>
      </div>
      <button id="sl-thumb" class="slider-thumb" type="button"></button>
    </div>
    <div style="margin-top: 12px; color: var(--muted); font-size: 13px;" id="sl-readout"></div>
  `
  const readout = root.querySelector("#sl-readout")
  const { slider, destroy } = mountSlider({
    root: "#sl-root",
    track: "#sl-track",
    rangeEl: "#sl-range",
    thumbs: ["#sl-thumb"],
    parent: root,
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 5,
    onValueChange: (v) => {
      readout.textContent = `Value: ${v}`
      ctx.onState(String(v))
    },
  })
  readout.textContent = `Value: ${slider.value.get()}`
  ctx.onState(String(slider.value.get()))
  return destroy
}

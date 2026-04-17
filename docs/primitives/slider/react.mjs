import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseSlider } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef, useState } = React
const useSlider = createUseSlider(React)

function Demo({ onState }) {
  const [value, setValue] = useState(50)
  const rootRef = useRef(null)
  const trackRef = useRef(null)
  const rangeRef = useRef(null)
  const thumbRef = useRef(null)

  const slider = useSlider({
    value,
    min: 0,
    max: 100,
    step: 5,
    onValueChange: (v) => {
      setValue(v)
      onState(String(v))
    },
  })

  useEffect(() => {
    if (!rootRef.current || !trackRef.current || !thumbRef.current) return
    return slider.mount({
      root: rootRef.current,
      track: trackRef.current,
      range: rangeRef.current ?? undefined,
      thumbs: [thumbRef.current],
    })
  }, [slider])

  return h(
    "div",
    null,
    h(
      "div",
      { ref: rootRef, ...slider.getRootProps(), className: "slider" },
      h(
        "div",
        { ref: trackRef, ...slider.getTrackProps(), className: "slider-track" },
        h("div", { ref: rangeRef, ...slider.getRangeProps(), className: "slider-range" }),
      ),
      h("button", {
        ref: thumbRef,
        ...slider.getThumbProps(),
        className: "slider-thumb",
        type: "button",
      }),
    ),
    h("div", { style: { marginTop: 12, color: "var(--muted)", fontSize: 13 } }, `Value: ${value}`),
  )
}

export function mount(root, ctx) {
  ctx.onState("50")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

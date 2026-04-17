import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseNumberInput } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useNumberInput = createUseNumberInput(React)

function Demo({ onState }) {
  const [v, setV] = useState(1)
  const ni = useNumberInput({
    value: v,
    min: 0,
    max: 99,
    step: 1,
    onValueChange: (next) => {
      setV(next)
      onState(`value: ${next ?? "—"}`)
    },
  })

  // Translate primitive's onInput shape ({currentTarget:{value}}) to React's
  // event shape, similar to combobox demo.
  const inputProps = ni.getInputProps()
  const incProps = ni.getIncrementProps()
  const decProps = ni.getDecrementProps()

  return h(
    "div",
    { style: { padding: "24px 0", maxWidth: 240 } },
    h(
      "div",
      { role: "group", style: { display: "flex", alignItems: "stretch", gap: 0 } },
      h(
        "button",
        {
          ...decProps,
          onPointerDown: (e) =>
            decProps.onPointerDown({ preventDefault: () => e.preventDefault() }),
          style: { padding: "6px 12px", borderRadius: "6px 0 0 6px" },
        },
        "−",
      ),
      h("input", {
        type: inputProps.type,
        inputMode: inputProps.inputmode,
        autoComplete: inputProps.autocomplete,
        role: inputProps.role,
        value: inputProps.value,
        "aria-valuenow": inputProps["aria-valuenow"],
        "aria-valuemin": inputProps["aria-valuemin"],
        "aria-valuemax": inputProps["aria-valuemax"],
        onChange: (e) => inputProps.onInput({ currentTarget: { value: e.target.value } }),
        onKeyDown: (e) =>
          inputProps.onKeyDown({ key: e.key, preventDefault: () => e.preventDefault() }),
        onBlur: () => inputProps.onBlur(),
        className: "combo-input",
        style: { flex: 1, borderRadius: 0, textAlign: "center" },
      }),
      h(
        "button",
        {
          ...incProps,
          onPointerDown: (e) =>
            incProps.onPointerDown({ preventDefault: () => e.preventDefault() }),
          style: { padding: "6px 12px", borderRadius: "0 6px 6px 0" },
        },
        "+",
      ),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("value: 1")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

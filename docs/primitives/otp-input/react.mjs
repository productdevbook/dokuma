import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseOtpInput } from "/dist/adapters/react.mjs"

const { createElement: h } = React
const useOtpInput = createUseOtpInput(React)

const LENGTH = 6

function Demo({ onState }) {
  const otp = useOtpInput({
    length: LENGTH,
    onValueChange: (v) => onState(v ? `value: ${v}` : "empty"),
    onComplete: (v) => onState(`complete: ${v}`),
  })

  return h(
    "div",
    { style: { padding: "24px 0" } },
    h(
      "div",
      { style: { display: "flex", gap: 6, alignItems: "center" } },
      Array.from({ length: LENGTH }, (_, i) => {
        const p = otp.getCellProps(i)
        return h("input", {
          key: i,
          id: p.id,
          type: p.type,
          inputMode: p.inputmode,
          autoComplete: p.autocomplete,
          maxLength: p.maxlength,
          pattern: p.pattern,
          value: p.value,
          "aria-label": p["aria-label"],
          className: "combo-input",
          style: { width: 36, textAlign: "center", padding: "6px 0" },
          onChange: (e) => p.onInput({ currentTarget: { value: e.target.value } }),
          onKeyDown: (e) => p.onKeyDown({ key: e.key, preventDefault: () => e.preventDefault() }),
          onPaste: (e) =>
            p.onPaste({
              clipboardData: e.clipboardData,
              preventDefault: () => e.preventDefault(),
            }),
          onFocus: (e) => p.onFocus({ currentTarget: e.currentTarget }),
        })
      }),
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("empty")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

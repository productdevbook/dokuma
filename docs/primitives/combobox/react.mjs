import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseCombobox, createUseComboboxItem } from "/dist/adapters/react.mjs"

const { createElement: h, useEffect, useRef } = React
const useCombobox = createUseCombobox(React)
const useComboboxItem = createUseComboboxItem(React)

const FRUITS = [
  ["apple", "Apple"],
  ["apricot", "Apricot"],
  ["banana", "Banana"],
  ["blueberry", "Blueberry"],
  ["cherry", "Cherry"],
  ["date", "Date"],
  ["dragonfruit", "Dragonfruit"],
  ["fig", "Fig"],
  ["grape", "Grape"],
  ["kiwi", "Kiwi"],
  ["lemon", "Lemon"],
  ["mango", "Mango"],
  ["orange", "Orange"],
  ["peach", "Peach"],
  ["pear", "Pear"],
  ["raspberry", "Raspberry"],
]

function Option({ cb, value, label, hidden }) {
  const item = useComboboxItem(cb, value, { label })
  const p = item.optionProps
  return h(
    "li",
    {
      id: p.id,
      role: "option",
      "aria-selected": p["aria-selected"],
      "data-highlighted": p["data-highlighted"] ? "" : undefined,
      className: "combo-option",
      hidden,
      onClick: p.onClick,
      onMouseEnter: p.onMouseEnter,
    },
    label,
  )
}

function Demo({ onState }) {
  const inputRef = useRef(null)
  const listboxRef = useRef(null)
  const triggerRef = useRef(null)

  const cb = useCombobox({
    onValueChange: (v) => onState(v ? `selected: ${v}` : "empty"),
  })

  useEffect(() => {
    if (!inputRef.current || !listboxRef.current) return
    return cb.mount({
      input: inputRef.current,
      listbox: listboxRef.current,
      trigger: triggerRef.current ?? undefined,
    })
  }, [cb])

  const inputProps = cb.getInputProps()
  const isOpen = cb.open.get()
  const filtered = cb.filteredItems.get()

  return h(
    "div",
    { style: { maxWidth: 360, padding: "24px 0" } },
    h(
      "div",
      { className: "combo-shell" },
      h("input", {
        ref: inputRef,
        type: "text",
        className: "combo-input",
        placeholder: "Pick a fruit…",
        id: inputProps.id,
        role: inputProps.role,
        "aria-expanded": inputProps["aria-expanded"],
        "aria-controls": inputProps["aria-controls"],
        "aria-activedescendant": inputProps["aria-activedescendant"],
        "aria-autocomplete": inputProps["aria-autocomplete"],
        autoComplete: "off",
        value: inputProps.value,
        onChange: (e) => inputProps.onInput({ currentTarget: { value: e.target.value } }),
        onKeyDown: inputProps.onKeyDown,
        onBlur: inputProps.onBlur,
        onClick: inputProps.onClick,
      }),
      h(
        "button",
        {
          ref: triggerRef,
          type: "button",
          className: "combo-trigger",
          "aria-hidden": true,
          tabIndex: -1,
        },
        "▾",
      ),
    ),
    h(
      "ul",
      {
        ref: listboxRef,
        className: "combo-listbox",
        hidden: !isOpen,
        role: "listbox",
        id: cb.listboxId,
      },
      // Render every option so each one stays registered, hide those filtered out.
      FRUITS.map(([value, label]) =>
        h(Option, { key: value, cb, value, label, hidden: !filtered.includes(value) }),
      ),
      isOpen && filtered.length === 0 ? h("li", { className: "combo-empty" }, "No matches") : null,
    ),
  )
}

export function mount(root, ctx) {
  ctx.onState("empty")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

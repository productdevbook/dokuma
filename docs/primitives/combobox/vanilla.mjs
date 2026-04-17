import { mountCombobox } from "/dist/adapters/vanilla.mjs"

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

export function mount(root, ctx) {
  root.innerHTML = `
    <div style="max-width: 360px; padding: 24px 0;">
      <div class="combo-shell">
        <input id="cb-input" class="combo-input" type="text" placeholder="Pick a fruit…" />
        <button id="cb-trigger" class="combo-trigger" type="button" aria-hidden="true">▾</button>
      </div>
      <ul id="cb-listbox" class="combo-listbox" hidden></ul>
    </div>
  `

  const input = root.querySelector("#cb-input")
  const listbox = root.querySelector("#cb-listbox")
  const trigger = root.querySelector("#cb-trigger")

  const { combobox, destroy } = mountCombobox({
    input,
    listbox,
    trigger,
    parent: root,
    onValueChange: (v) => ctx.onState(v ? `selected: ${v}` : "empty"),
  })

  // Register all fruits.
  for (const [value, label] of FRUITS) {
    combobox.registerItem(value, { label })
  }

  const render = () => {
    const isOpen = combobox.open.get()
    listbox.hidden = !isOpen
    listbox.innerHTML = ""
    if (!isOpen) return
    const filtered = combobox.filteredItems.get()
    if (filtered.length === 0) {
      const li = document.createElement("li")
      li.className = "combo-empty"
      li.textContent = "No matches"
      listbox.append(li)
      return
    }
    for (const value of filtered) {
      const props = combobox.getOptionProps(value)
      const li = document.createElement("li")
      li.id = props.id
      li.className = "combo-option"
      li.setAttribute("role", "option")
      li.setAttribute("aria-selected", props["aria-selected"])
      if (props["data-highlighted"]) li.setAttribute("data-highlighted", "")
      if (props["data-disabled"]) li.setAttribute("data-disabled", "")
      li.textContent = combobox.labelFor(value)
      listbox.append(li)
    }
  }

  const unsubs = [
    combobox.open.subscribe(render),
    combobox.query.subscribe(render),
    combobox.highlighted.subscribe(render),
    combobox.value.subscribe(render),
  ]
  render()
  ctx.onState("empty")

  return () => {
    for (const u of unsubs) u()
    destroy()
  }
}

import * as React from "react"
import { createRoot } from "react-dom/client"
import { createUseTab, createUseTabs } from "/dist/adapters/react.mjs"

const { createElement: h, useState } = React
const useTabs = createUseTabs(React)
const useTab = createUseTab(React)

const TABS = [
  {
    value: "overview",
    title: "Overview",
    body: "The same headless tabs primitive every framework consumes.",
  },
  {
    value: "install",
    title: "Install",
    body: 'pnpm add dokuma or import from esm.sh in a single <script type="module"> tag.',
  },
  {
    value: "api",
    title: "API",
    body: "One coordinator + per-tab register. ARIA, roving tabindex, keyboard for you.",
  },
]

function Trigger({ tabs, value, title }) {
  const { tabProps } = useTab(tabs, value)
  return h("button", { ...tabProps, className: "tabs-trigger" }, title)
}

function Panel({ tabs, value, body }) {
  const { panelProps } = useTab(tabs, value)
  return h(
    "div",
    { ...panelProps, className: "tabs-panel" },
    h("p", { style: { margin: 0, color: "var(--muted)" } }, body),
  )
}

function Demo({ onState }) {
  const [value, setValue] = useState("overview")
  const tabs = useTabs({
    value,
    onValueChange: (v) => {
      setValue(v)
      onState(`selected: ${v}`)
    },
  })

  return h(
    "div",
    { className: "tabs", ...tabs.getRootProps() },
    h(
      "div",
      { className: "tabs-list", ...tabs.getListProps() },
      TABS.map((t) => h(Trigger, { key: t.value, tabs, value: t.value, title: t.title })),
    ),
    TABS.map((t) => h(Panel, { key: t.value, tabs, value: t.value, body: t.body })),
  )
}

export function mount(root, ctx) {
  ctx.onState("selected: overview")
  const reactRoot = createRoot(root)
  reactRoot.render(h(Demo, { onState: ctx.onState }))
  return () => reactRoot.unmount()
}

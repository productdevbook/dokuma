// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createDisclosure } from "../src/primitives/disclosure.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createDisclosure (uncontrolled)", () => {
  it("starts closed by default", () => {
    const d = createDisclosure()
    expect(d.open.get()).toBe(false)
    expect(d.getTriggerProps()["aria-expanded"]).toBe(false)
    expect(d.getPanelProps().hidden).toBe(true)
  })

  it("respects defaultOpen", () => {
    const d = createDisclosure({ defaultOpen: true })
    expect(d.open.get()).toBe(true)
    expect(d.getPanelProps().hidden).toBe(false)
  })

  it("toggle flips the state", () => {
    const d = createDisclosure()
    d.toggle()
    expect(d.open.get()).toBe(true)
    d.toggle()
    expect(d.open.get()).toBe(false)
  })

  it("show / hide are explicit", () => {
    const d = createDisclosure()
    d.show()
    expect(d.open.get()).toBe(true)
    d.show()
    expect(d.open.get()).toBe(true)
    d.hide()
    expect(d.open.get()).toBe(false)
  })

  it("notifies subscribers", () => {
    const d = createDisclosure()
    const fn = vi.fn()
    d.open.subscribe(fn)
    d.toggle()
    d.toggle()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, true)
    expect(fn).toHaveBeenNthCalledWith(2, false)
  })

  it("calls onOpenChange", () => {
    const onOpenChange = vi.fn()
    const d = createDisclosure({ onOpenChange })
    d.toggle()
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("getTriggerProps().onClick toggles state", () => {
    const d = createDisclosure()
    const props = d.getTriggerProps()
    props.onClick()
    expect(d.open.get()).toBe(true)
    props.onClick({ preventDefault: () => {} })
    expect(d.open.get()).toBe(false)
  })

  it("triggerId and panelId are wired via aria-controls / id", () => {
    const d = createDisclosure()
    const trigger = d.getTriggerProps()
    const panel = d.getPanelProps()
    expect(trigger["aria-controls"]).toBe(panel.id)
    expect(trigger.id).toBe(d.triggerId)
    expect(panel.id).toBe(d.panelId)
  })

  it("accepts a panelId override", () => {
    const d = createDisclosure({ panelId: "custom-panel" })
    expect(d.panelId).toBe("custom-panel")
    expect(d.getPanelProps().id).toBe("custom-panel")
    expect(d.getTriggerProps()["aria-controls"]).toBe("custom-panel")
  })
})

describe("createDisclosure (disabled)", () => {
  it("ignores toggle/show/hide while disabled", () => {
    let disabled = true
    const d = createDisclosure({ disabled: () => disabled })
    d.toggle()
    expect(d.open.get()).toBe(false)
    d.show()
    expect(d.open.get()).toBe(false)
    disabled = false
    d.show()
    expect(d.open.get()).toBe(true)
  })

  it("exposes aria-disabled and data-disabled", () => {
    const d = createDisclosure({ disabled: () => true })
    const t = d.getTriggerProps()
    expect(t["aria-disabled"]).toBe(true)
    expect(t["data-disabled"]).toBe(true)
  })
})

describe("createDisclosure (controlled)", () => {
  it("reads open from the function each time", () => {
    let open = false
    const d = createDisclosure({ open: () => open })
    expect(d.open.get()).toBe(false)
    open = true
    expect(d.open.get()).toBe(true)
    expect(d.getTriggerProps()["aria-expanded"]).toBe(true)
  })

  it("does not mutate internal state in controlled mode", () => {
    let open = false
    const onOpenChange = vi.fn()
    const d = createDisclosure({ open: () => open, onOpenChange })
    d.toggle()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(d.open.get()).toBe(false) // still controlled by `open`
  })
})

describe("createDisclosure.mount (DOM)", () => {
  it("toggles on click and syncs ARIA", () => {
    const trigger = document.createElement("button")
    const panel = document.createElement("div")
    document.body.append(trigger, panel)

    const d = createDisclosure()
    const destroy = d.mount({ trigger, panel })

    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(panel.hasAttribute("hidden")).toBe(true)

    trigger.click()
    expect(d.open.get()).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(panel.hasAttribute("hidden")).toBe(false)
    expect(panel.getAttribute("data-state")).toBe("open")

    destroy()
    trigger.click()
    expect(d.open.get()).toBe(true) // listener removed
  })
})

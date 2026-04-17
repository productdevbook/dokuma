// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createMenu } from "../src/primitives/menu.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
  vi.useRealTimers()
})

describe("createMenu (basic)", () => {
  it("starts closed; show/hide/toggle", () => {
    const m = createMenu()
    expect(m.open.get()).toBe(false)
    m.show()
    expect(m.open.get()).toBe(true)
    m.hide()
    expect(m.open.get()).toBe(false)
    m.toggle()
    expect(m.open.get()).toBe(true)
  })

  it("trigger has aria-haspopup=menu and aria-controls", () => {
    const m = createMenu()
    const tp = m.getTriggerProps()
    expect(tp["aria-haspopup"]).toBe("menu")
    expect(tp["aria-controls"]).toBe(m.contentId)
    expect(tp.id).toBe(m.triggerId)
  })

  it("content has role=menu and aria-labelledby", () => {
    const m = createMenu()
    const cp = m.getContentProps()
    expect(cp.role).toBe("menu")
    expect(cp["aria-labelledby"]).toBe(m.triggerId)
    expect(cp.tabIndex).toBe(-1)
  })

  it("item has role=menuitem and tabIndex=-1", () => {
    const m = createMenu()
    m.registerItem("a")
    const ip = m.getItemProps("a")
    expect(ip.role).toBe("menuitem")
    expect(ip.tabIndex).toBe(-1)
  })
})

describe("createMenu (selection)", () => {
  it("select calls onSelect and closes when closeOnSelect=true (default)", () => {
    const onSelect = vi.fn()
    const m = createMenu({ defaultOpen: true })
    m.registerItem("a", { onSelect })
    m.select("a")
    expect(onSelect).toHaveBeenCalled()
    expect(m.open.get()).toBe(false)
  })

  it("select keeps open when closeOnSelect=false", () => {
    const onSelect = vi.fn()
    const m = createMenu({ defaultOpen: true, closeOnSelect: false })
    m.registerItem("a", { onSelect })
    m.select("a")
    expect(onSelect).toHaveBeenCalled()
    expect(m.open.get()).toBe(true)
  })

  it("select on disabled item does nothing", () => {
    const onSelect = vi.fn()
    const m = createMenu({ defaultOpen: true })
    m.registerItem("a", { onSelect, disabled: () => true })
    m.select("a")
    expect(onSelect).not.toHaveBeenCalled()
    expect(m.open.get()).toBe(true)
  })

  it("getItemProps onClick selects", () => {
    const onSelect = vi.fn()
    const m = createMenu({ defaultOpen: true })
    m.registerItem("a", { onSelect })
    m.getItemProps("a").onClick()
    expect(onSelect).toHaveBeenCalled()
  })

  it("disabled item exposes aria-disabled and data-disabled", () => {
    const m = createMenu()
    m.registerItem("a", { disabled: () => true })
    const ip = m.getItemProps("a") as unknown as Record<string, unknown>
    expect(ip["aria-disabled"]).toBe(true)
    expect(ip["data-disabled"]).toBe(true)
  })
})

describe("createMenu (highlight)", () => {
  it("setHighlighted updates and persists", () => {
    const m = createMenu()
    m.registerItem("a")
    m.setHighlighted("a")
    expect(m.highlighted.get()).toBe("a")
  })

  it("data-highlighted reflects current highlight", () => {
    const m = createMenu()
    m.registerItem("a")
    m.registerItem("b")
    m.setHighlighted("b")
    expect(
      (m.getItemProps("a") as unknown as Record<string, unknown>)["data-highlighted"],
    ).toBeUndefined()
    expect((m.getItemProps("b") as unknown as Record<string, unknown>)["data-highlighted"]).toBe(
      true,
    )
  })
})

describe("createMenu (mount)", () => {
  it("trigger click toggles", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const m = createMenu()
    const destroy = m.mount({ trigger, content })

    trigger.click()
    expect(m.open.get()).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    trigger.click()
    expect(m.open.get()).toBe(false)
    destroy()
  })

  it("escape closes", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const m = createMenu({ defaultOpen: true })
    const destroy = m.mount({ trigger, content })

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(m.open.get()).toBe(false)
    destroy()
  })

  it("Tab from menu closes the menu", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const m = createMenu({ defaultOpen: true })
    const destroy = m.mount({ trigger, content })

    content.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }))
    expect(m.open.get()).toBe(false)
    destroy()
  })

  it("trigger ArrowDown opens", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const m = createMenu()
    m.registerItem("a")
    const destroy = m.mount({ trigger, content })

    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    expect(m.open.get()).toBe(true)
    destroy()
  })

  it("Enter on highlighted item selects", () => {
    const onSelect = vi.fn()
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const m = createMenu({ defaultOpen: true })
    m.registerItem("a", { onSelect })
    const destroy = m.mount({ trigger, content })

    m.setHighlighted("a")
    content.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(onSelect).toHaveBeenCalled()
    destroy()
  })
})

describe("createMenu (typeahead)", () => {
  it("typing 'b' jumps to first item starting with b", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const m = createMenu({ defaultOpen: true })
    const ha = m.registerItem("apple", { label: "Apple" })
    const hb = m.registerItem("banana", { label: "Banana" })
    const ba = document.createElement("button")
    ba.id = ha.itemId
    const bb = document.createElement("button")
    bb.id = hb.itemId
    document.body.append(ba, bb)
    const destroy = m.mount({ trigger, content })

    content.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }))
    expect(m.highlighted.get()).toBe("banana")
    destroy()
  })

  it("falls back to value when label is missing", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const m = createMenu({ defaultOpen: true })
    m.registerItem("zebra")
    const destroy = m.mount({ trigger, content })

    content.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true }))
    expect(m.highlighted.get()).toBe("zebra")
    destroy()
  })
})

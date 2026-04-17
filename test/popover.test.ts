// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createPopover } from "../src/primitives/popover.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createPopover (basic)", () => {
  it("starts closed; show/hide/toggle work", () => {
    const p = createPopover()
    expect(p.open.get()).toBe(false)
    p.show()
    expect(p.open.get()).toBe(true)
    p.toggle()
    expect(p.open.get()).toBe(false)
    p.toggle()
    expect(p.open.get()).toBe(true)
  })

  it("trigger has aria-haspopup=dialog and aria-controls", () => {
    const p = createPopover()
    const tp = p.getTriggerProps()
    expect(tp["aria-haspopup"]).toBe("dialog")
    expect(tp["aria-controls"]).toBe(p.contentId)
  })

  it("content has role=dialog and tabIndex=-1", () => {
    const p = createPopover()
    const cp = p.getContentProps()
    expect(cp.role).toBe("dialog")
    expect(cp.tabIndex).toBe(-1)
  })

  it("close props include aria-label", () => {
    const p = createPopover()
    expect(p.getCloseProps()["aria-label"]).toBe("Close")
    expect(p.getCloseProps("Dismiss")["aria-label"]).toBe("Dismiss")
  })
})

describe("createPopover (mount)", () => {
  it("trigger click toggles", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    const inner = document.createElement("button")
    inner.textContent = "ok"
    content.append(inner)
    document.body.append(trigger, content)

    const p = createPopover()
    const destroy = p.mount({ trigger, content })

    trigger.click()
    expect(p.open.get()).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")

    trigger.click()
    expect(p.open.get()).toBe(false)

    destroy()
  })

  it("escape closes", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    const inner = document.createElement("button")
    content.append(inner)
    document.body.append(trigger, content)
    const p = createPopover({ defaultOpen: true })
    const destroy = p.mount({ trigger, content })

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(p.open.get()).toBe(false)

    destroy()
  })

  it("mousedown outside closes", () => {
    const trigger = document.createElement("button")
    const outside = document.createElement("div")
    const content = document.createElement("div")
    const inner = document.createElement("button")
    content.append(inner)
    document.body.append(trigger, outside, content)
    const p = createPopover({ defaultOpen: true })
    const destroy = p.mount({ trigger, content })

    outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    expect(p.open.get()).toBe(false)

    destroy()
  })

  it("mousedown on trigger does not close (toggle handles it)", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    const inner = document.createElement("button")
    content.append(inner)
    document.body.append(trigger, content)
    const p = createPopover({ defaultOpen: true })
    const destroy = p.mount({ trigger, content })

    trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    expect(p.open.get()).toBe(true)

    destroy()
  })

  it("focus is trapped inside content when trapFocus is true (default)", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    const a = document.createElement("button")
    a.textContent = "a"
    const b = document.createElement("button")
    b.textContent = "b"
    content.append(a, b)
    document.body.append(trigger, content)

    trigger.focus()
    const p = createPopover()
    const destroy = p.mount({ trigger, content })
    trigger.click()
    expect(document.activeElement).toBe(a)

    destroy()
  })
})

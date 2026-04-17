// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createDialog } from "../src/primitives/dialog.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createDialog (basic)", () => {
  it("starts closed by default", () => {
    const d = createDialog()
    expect(d.open.get()).toBe(false)
    expect(d.getTriggerProps()["aria-expanded"]).toBe("false")
    expect(d.getContentProps()["data-state"]).toBe("closed")
  })

  it("respects defaultOpen", () => {
    const d = createDialog({ defaultOpen: true })
    expect(d.open.get()).toBe(true)
    expect(d.getContentProps()["data-state"]).toBe("open")
  })

  it("show / hide / toggle", () => {
    const d = createDialog()
    d.show()
    expect(d.open.get()).toBe(true)
    d.hide()
    expect(d.open.get()).toBe(false)
    d.toggle()
    expect(d.open.get()).toBe(true)
  })

  it("calls onOpenChange", () => {
    const onOpenChange = vi.fn()
    const d = createDialog({ onOpenChange })
    d.show()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    d.hide()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})

describe("createDialog (props shape)", () => {
  it("trigger props include aria-haspopup=dialog", () => {
    const d = createDialog()
    expect(d.getTriggerProps()["aria-haspopup"]).toBe("dialog")
  })

  it("content has role=dialog and tabIndex=-1", () => {
    const d = createDialog()
    const c = d.getContentProps()
    expect(c.role).toBe("dialog")
    expect(c.tabIndex).toBe(-1)
  })

  it("aria-modal emitted only when modal:true", () => {
    const modal = createDialog({ modal: true })
    expect(modal.getContentProps()["aria-modal"]).toBe("true")
    const non = createDialog({ modal: false })
    expect(non.getContentProps()["aria-modal"]).toBeUndefined()
  })

  it("title and description ids are stable (eager)", () => {
    const d = createDialog()
    expect(d.getTitleProps().id).toBe(d.titleId)
    expect(d.getDescriptionProps().id).toBe(d.descriptionId)
  })

  it("close props include aria-label", () => {
    const d = createDialog()
    expect(d.getCloseProps()["aria-label"]).toBe("Close")
    expect(d.getCloseProps("Dismiss")["aria-label"]).toBe("Dismiss")
  })

  it("aria-controls links trigger to content", () => {
    const d = createDialog()
    expect(d.getTriggerProps()["aria-controls"]).toBe(d.contentId)
  })
})

describe("createDialog (controlled)", () => {
  it("reads open via getter", () => {
    let v = false
    const d = createDialog({ open: () => v })
    expect(d.open.get()).toBe(false)
    v = true
    expect(d.open.get()).toBe(true)
    expect(d.getTriggerProps()["aria-expanded"]).toBe("true")
  })
})

describe("createDialog.mount (DOM)", () => {
  it("toggles via trigger click and syncs ARIA", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    const focusable = document.createElement("button")
    focusable.textContent = "ok"
    content.append(focusable)
    document.body.append(trigger, content)

    const d = createDialog()
    const destroy = d.mount({ trigger, content })

    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(content.getAttribute("data-state")).toBe("closed")

    trigger.click()
    expect(d.open.get()).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(content.getAttribute("data-state")).toBe("open")

    destroy()
  })

  it("Escape closes when closeOnEscape is true (default)", async () => {
    const content = document.createElement("div")
    document.body.append(content)
    const d = createDialog({ defaultOpen: true })
    const destroy = d.mount({ content })

    expect(d.open.get()).toBe(true)
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(d.open.get()).toBe(false)

    destroy()
  })

  it("Escape does not close when closeOnEscape is false", () => {
    const content = document.createElement("div")
    document.body.append(content)
    const d = createDialog({ defaultOpen: true, closeOnEscape: false })
    const destroy = d.mount({ content })

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(d.open.get()).toBe(true)

    destroy()
  })

  it("mousedown outside content closes when closeOnOutsideClick is true (default)", () => {
    const outside = document.createElement("div")
    const content = document.createElement("div")
    document.body.append(outside, content)
    const d = createDialog({ defaultOpen: true })
    const destroy = d.mount({ content })

    const ev = new MouseEvent("mousedown", { bubbles: true })
    outside.dispatchEvent(ev)
    expect(d.open.get()).toBe(false)

    destroy()
  })

  it("mousedown inside content does not close", () => {
    const content = document.createElement("div")
    const inner = document.createElement("button")
    content.append(inner)
    document.body.append(content)
    const d = createDialog({ defaultOpen: true })
    const destroy = d.mount({ content })

    const ev = new MouseEvent("mousedown", { bubbles: true })
    inner.dispatchEvent(ev)
    expect(d.open.get()).toBe(true)

    destroy()
  })

  it("focus moves into content on open and is restored on close", async () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    const inner = document.createElement("button")
    inner.textContent = "ok"
    content.append(inner)
    document.body.append(trigger, content)

    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const d = createDialog()
    const destroy = d.mount({ trigger, content })
    trigger.click()
    expect(document.activeElement).toBe(inner)

    d.hide()
    await Promise.resolve()
    expect(document.activeElement).toBe(trigger)

    destroy()
  })

  it("Tab loops within trapped content", () => {
    const content = document.createElement("div")
    const a = document.createElement("button")
    a.textContent = "a"
    const b = document.createElement("button")
    b.textContent = "b"
    content.append(a, b)
    document.body.append(content)

    const d = createDialog({ defaultOpen: true })
    const destroy = d.mount({ content })

    expect(document.activeElement).toBe(a)
    b.focus()
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }))
    expect(document.activeElement).toBe(a)

    destroy()
  })
})

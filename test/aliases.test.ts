// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createAlertDialog } from "../src/primitives/alert-dialog.ts"
import { createAspectRatio } from "../src/primitives/aspect-ratio.ts"
import { createCollapsible } from "../src/primitives/collapsible.ts"
import { createHoverCard } from "../src/primitives/hover-card.ts"
import { createLabel } from "../src/primitives/label.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createCollapsible", () => {
  it("is a Disclosure under a different name", () => {
    const c = createCollapsible({ defaultOpen: true })
    expect(c.open.get()).toBe(true)
    c.hide()
    expect(c.open.get()).toBe(false)
    expect(c.getTriggerProps()).toMatchObject({
      "aria-expanded": false,
    })
  })

  it("toggle/show/hide work end-to-end", () => {
    const c = createCollapsible()
    expect(c.open.get()).toBe(false)
    c.toggle()
    expect(c.open.get()).toBe(true)
    c.toggle()
    expect(c.open.get()).toBe(false)
    c.show()
    expect(c.open.get()).toBe(true)
  })

  it("controlled mode delegates to the open getter", () => {
    let open = false
    const onOpenChange = vi.fn()
    const c = createCollapsible({ open: () => open, onOpenChange })
    c.toggle()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(c.open.get()).toBe(false)
    open = true
    expect(c.open.get()).toBe(true)
  })

  it("mount syncs ARIA on the trigger and panel", () => {
    const trigger = document.createElement("button")
    const panel = document.createElement("div")
    document.body.append(trigger, panel)
    const c = createCollapsible()
    const destroy = c.mount({ trigger, panel })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(panel.hasAttribute("hidden")).toBe(true)
    trigger.click()
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(panel.hasAttribute("hidden")).toBe(false)
    destroy()
  })
})

describe("createAlertDialog", () => {
  it('uses role="alertdialog" on content', () => {
    const ad = createAlertDialog({ defaultOpen: true })
    expect(ad.getContentProps().role).toBe("alertdialog")
  })

  it("forces closeOnOutsideClick off (mousedown outside content does not hide)", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    const outside = document.createElement("div")
    document.body.append(trigger, content, outside)

    const ad = createAlertDialog({ defaultOpen: true })
    const destroy = ad.mount({ trigger, content })
    expect(ad.open.get()).toBe(true)

    outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    // AlertDialog must remain open after outside click
    expect(ad.open.get()).toBe(true)

    destroy()
  })

  it("Escape still closes (closeOnEscape default = true)", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)

    const ad = createAlertDialog({ defaultOpen: true })
    const destroy = ad.mount({ trigger, content })

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    expect(ad.open.get()).toBe(false)

    destroy()
  })

  it("close button still hides", () => {
    const ad = createAlertDialog({ defaultOpen: true })
    const close = ad.getCloseProps()
    close.onClick()
    expect(ad.open.get()).toBe(false)
  })
})

describe("createHoverCard", () => {
  it('content uses role="dialog" so interactive children are exposed', () => {
    const hc = createHoverCard({ defaultOpen: true })
    expect(hc.getContentProps().role).toBe("dialog")
  })

  it("delays show via setTimeout (debounced, not instant)", () => {
    vi.useFakeTimers()
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const hc = createHoverCard()
    const destroy = hc.mount({ trigger, content })

    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    // 100ms < HoverCard default 700ms → still closed
    vi.advanceTimersByTime(100)
    expect(hc.open.get()).toBe(false)

    destroy()
    vi.useRealTimers()
  })

  it("user can override the default delays", () => {
    vi.useFakeTimers()
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const hc = createHoverCard({ delayShow: 50, delayHide: 50 })
    const destroy = hc.mount({ trigger, content })

    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    vi.advanceTimersByTime(50)
    expect(hc.open.get()).toBe(true)

    destroy()
    vi.useRealTimers()
  })
})

describe("createLabel", () => {
  it("emits the DOM `for` attribute (not htmlFor)", () => {
    const l = createLabel({ htmlFor: "my-input" })
    const p = l.getRootProps()
    expect(p.for).toBe("my-input")
    expect(p.id).toBeUndefined()
  })

  it("returns empty when no options provided", () => {
    expect(createLabel().getRootProps()).toEqual({})
  })

  it("passes id when set", () => {
    expect(createLabel({ id: "x" }).getRootProps()).toEqual({ id: "x" })
  })

  it("emits both `for` and `id` together", () => {
    expect(createLabel({ htmlFor: "input-1", id: "label-1" }).getRootProps()).toEqual({
      for: "input-1",
      id: "label-1",
    })
  })

  it("ignores empty-string htmlFor (treated as missing)", () => {
    expect(createLabel({ htmlFor: "" }).getRootProps()).toEqual({})
  })
})

describe("createAspectRatio", () => {
  it("default ratio is 1 (square)", () => {
    const ar = createAspectRatio()
    expect(ar.ratio).toBe(1)
    expect(ar.getRootProps().style.aspectRatio).toBe("1")
  })

  it("emits ratio as string for CSS aspect-ratio property", () => {
    const ar = createAspectRatio({ ratio: 16 / 9 })
    expect(ar.getRootProps().style.aspectRatio).toBe(String(16 / 9))
    expect(ar.getRootProps().style.width).toBe("100%")
  })

  it("each call returns a fresh style object (no shared reference)", () => {
    const ar = createAspectRatio({ ratio: 4 / 3 })
    const a = ar.getRootProps()
    const b = ar.getRootProps()
    expect(a).not.toBe(b)
    expect(a.style).not.toBe(b.style)
  })

  it("supports portrait ratios (less than 1)", () => {
    const ar = createAspectRatio({ ratio: 9 / 16 })
    expect(ar.ratio).toBe(9 / 16)
    expect(ar.getRootProps().style.aspectRatio).toBe(String(9 / 16))
  })
})

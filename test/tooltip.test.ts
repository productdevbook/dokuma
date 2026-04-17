// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createTooltip } from "../src/primitives/tooltip.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
  vi.useFakeTimers()
})

describe("createTooltip (basic)", () => {
  it("starts closed; show/hide flip state", () => {
    const t = createTooltip()
    expect(t.open.get()).toBe(false)
    t.show()
    expect(t.open.get()).toBe(true)
    t.hide()
    expect(t.open.get()).toBe(false)
  })

  it("aria-describedby only present when open", () => {
    const t = createTooltip()
    expect(t.getTriggerProps()["aria-describedby"]).toBeUndefined()
    t.show()
    expect(t.getTriggerProps()["aria-describedby"]).toBe(t.contentId)
  })

  it("disabled blocks show", () => {
    const t = createTooltip({ disabled: () => true })
    t.show()
    expect(t.open.get()).toBe(false)
  })

  it("content has role=tooltip", () => {
    const t = createTooltip()
    expect(t.getContentProps().role).toBe("tooltip")
  })
})

describe("createTooltip (mount)", () => {
  it("hover after delay shows", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const t = createTooltip({ delayShow: 100 })
    const destroy = t.mount({ trigger, content })

    trigger.dispatchEvent(new MouseEvent("mouseenter"))
    expect(t.open.get()).toBe(false)
    vi.advanceTimersByTime(100)
    expect(t.open.get()).toBe(true)

    destroy()
  })

  it("focus shows immediately (no delay)", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const t = createTooltip({ delayShow: 9999 })
    const destroy = t.mount({ trigger, content })

    trigger.dispatchEvent(new FocusEvent("focusin"))
    expect(t.open.get()).toBe(true)

    destroy()
  })

  it("pointerdown cancels pending show", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const t = createTooltip({ delayShow: 100 })
    const destroy = t.mount({ trigger, content })

    trigger.dispatchEvent(new MouseEvent("mouseenter"))
    trigger.dispatchEvent(new MouseEvent("pointerdown"))
    vi.advanceTimersByTime(200)
    expect(t.open.get()).toBe(false)

    destroy()
  })

  it("touchstart hides", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const t = createTooltip({ defaultOpen: true })
    const destroy = t.mount({ trigger, content })

    document.dispatchEvent(new TouchEvent("touchstart"))
    expect(t.open.get()).toBe(false)

    destroy()
  })

  it("escape hides", () => {
    const trigger = document.createElement("button")
    const content = document.createElement("div")
    document.body.append(trigger, content)
    const t = createTooltip({ defaultOpen: true })
    const destroy = t.mount({ trigger, content })

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(t.open.get()).toBe(false)

    destroy()
  })
})
